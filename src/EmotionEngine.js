/**
 * EmotionEngine
 * -------------
 * A browser-safe, demo-friendly mood inference engine based on lightweight interaction signals.
 *
 * Goals:
 * - Stable in hackathon demos (no crashes, sensible defaults)
 * - Visibly reactive in real-time (scores update continuously)
 * - Production-minded cleanup (all listeners removed on destroy)
 *
 * Signals (weighted):
 * - Mouse: 25%
 * - Keyboard: 20%
 * - Tabs (visibility/focus): 20%
 * - Idle: 20%
 * - Scroll: 15%
 *
 * API:
 * - start(): begin tracking
 * - destroy(): stop tracking and cleanup
 * - on(event, handler): subscribe ("moodChanged")
 * - off(event, handler): unsubscribe
 * - getState(): current mood + scores snapshot
 * - forceMood(moodName): manual override for demos (temporary)
 */

const MOODS = Object.freeze({
  RELAXED: "RELAXED",
  FOCUSED: "FOCUSED",
  STRESSED: "STRESSED",
  TIRED: "TIRED",
});

function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clamp(x, min, max) {
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

function wallClockHour() {
  try {
    return new Date().getHours();
  } catch {
    return null;
  }
}

/**
 * Very small event emitter that works in browsers and React apps.
 * (Avoids relying on Node.js EventEmitter in hackathon environments.)
 */
class Emitter {
  constructor() {
    this._map = new Map();
  }
  on(eventName, handler) {
    if (typeof handler !== "function") return;
    const set = this._map.get(eventName) ?? new Set();
    set.add(handler);
    this._map.set(eventName, set);
  }
  off(eventName, handler) {
    const set = this._map.get(eventName);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this._map.delete(eventName);
  }
  emit(eventName, payload) {
    const set = this._map.get(eventName);
    if (!set || set.size === 0) return;
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch {
        // Never allow subscriber errors to break the engine.
      }
    }
  }
  clear() {
    this._map.clear();
  }
}

export class EmotionEngine {
  /**
   * @param {object} [config]
   * @param {boolean} [config.debug=false] - logs scores every 5s + mood transitions
   * @param {number} [config.calibrationMs=12000] - baseline collection window (10–15s)
   * @param {number} [config.manualOverrideMs=12000] - override duration (10–15s)
   * @param {number} [config.tickMs=500] - scoring tick cadence
   */
  constructor(config = {}) {
    this._config = {
      debug: Boolean(config.debug),
      calibrationMs: clamp(config.calibrationMs ?? 12000, 10000, 15000),
      manualOverrideMs: clamp(config.manualOverrideMs ?? 12000, 10000, 15000),
      tickMs: clamp(config.tickMs ?? 500, 250, 2000),
    };

    this._emitter = new Emitter();

    this._running = false;
    this._destroyed = false;

    this._mood = MOODS.RELAXED; // Default state requirement
    this._lastMood = MOODS.RELAXED;

    // Manual override (demo safety)
    this._forcedMood = null;
    this._forcedUntilMs = 0;

    // Calibration
    this._startMs = 0;
    this._calibrationEndMs = 0;
    this._calibrated = false;
    this._baseline = {
      mouseSpeedPxPerS: null,
      typingKeysPerS: null,
      interactionsPerS: null,
      scrollPxPerS: null,
    };

    // Trackers can be disabled if they error (safe fallbacks).
    this._trackerEnabled = {
      mouse: true,
      keyboard: true,
      tabs: true,
      idle: true,
      scroll: true,
    };

    // Raw signal accumulation (rolling)
    this._lastTickMs = 0;
    this._lastInteractionMs = 0;

    this._mouse = {
      lastX: null,
      lastY: null,
      lastMoveMs: 0,
      distPxSinceTick: 0,
      movesSinceTick: 0,
    };

    this._keyboard = {
      keysSinceTick: 0,
    };

    this._tabs = {
      switchesSinceTick: 0,
      hidden: false,
    };

    this._scroll = {
      pxSinceTick: 0,
      eventsSinceTick: 0,
    };

    // Calibration aggregators
    this._cal = {
      mouseDistPx: 0,
      mouseMs: 0,
      keyCount: 0,
      interactionCount: 0,
      scrollPx: 0,
      scrollMs: 0,
      // for interactionsPerS: count in window / duration
    };

    // Timers
    this._tickInterval = null;
    this._debugInterval = null;

    // Listener bookkeeping for cleanup
    this._listeners = [];

    // Bind handlers once
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onScroll = this._onScroll.bind(this);
  }

  on(eventName, handler) {
    this._emitter.on(eventName, handler);
  }

  off(eventName, handler) {
    this._emitter.off(eventName, handler);
  }

  /**
   * Force a mood immediately for demo control.
   * - Emits "moodChanged" immediately
   * - Temporarily overrides scoring for 10–15 seconds
   */
  forceMood(moodName) {
    const normalized = typeof moodName === "string" ? moodName.toUpperCase() : "";
    const mood = MOODS[normalized] ?? null;
    if (!mood) return;

    const t = nowMs();
    this._forcedMood = mood;
    this._forcedUntilMs = t + this._config.manualOverrideMs;
    this._setMood(mood, {
      reason: "manualOverride",
      overrideActive: true,
    });
  }

  getState() {
    return {
      mood: this._mood,
      calibrated: this._calibrated,
      baseline: { ...this._baseline },
      trackerEnabled: { ...this._trackerEnabled },
      forcedMood: this._forcedMood,
      forcedUntilMs: this._forcedUntilMs,
      scores: this._lastScores ? { ...this._lastScores } : null,
    };
  }

  start() {
    if (this._destroyed) return;
    if (this._running) return;

    this._running = true;
    this._startMs = nowMs();
    this._calibrationEndMs = this._startMs + this._config.calibrationMs;
    this._lastTickMs = this._startMs;
    this._lastInteractionMs = this._startMs;

    // Default mood should be RELAXED; if insufficient data, remain RELAXED.
    this._mood = MOODS.RELAXED;
    this._lastMood = MOODS.RELAXED;

    this._installListeners();

    // Main scoring loop
    this._tickInterval = setInterval(() => {
      try {
        this._tick();
      } catch (e) {
        // Safe fallback: never crash the app.
        if (this._config.debug) {
          // eslint-disable-next-line no-console
          console.warn("[EmotionEngine] tick failed (continuing):", e);
        }
      }
    }, this._config.tickMs);

    // Debug loop (optional)
    if (this._config.debug) {
      this._debugInterval = setInterval(() => {
        try {
          const s = this.getState();
          // eslint-disable-next-line no-console
          console.log("[EmotionEngine] scores:", s.scores, "mood:", s.mood, "calibrated:", s.calibrated);
        } catch {
          // ignore
        }
      }, 5000);
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._running = false;

    try {
      if (this._tickInterval) clearInterval(this._tickInterval);
      if (this._debugInterval) clearInterval(this._debugInterval);
    } catch {
      // ignore
    }
    this._tickInterval = null;
    this._debugInterval = null;

    this._removeAllListeners();
    this._emitter.clear();

    // Reset internal state (cleanup improvements)
    this._mood = MOODS.RELAXED;
    this._lastMood = MOODS.RELAXED;
    this._forcedMood = null;
    this._forcedUntilMs = 0;
    this._calibrated = false;
    this._baseline = {
      mouseSpeedPxPerS: null,
      typingKeysPerS: null,
      interactionsPerS: null,
      scrollPxPerS: null,
    };
    this._trackerEnabled = {
      mouse: true,
      keyboard: true,
      tabs: true,
      idle: true,
      scroll: true,
    };
    this._lastScores = null;
  }

  _installListeners() {
    // All listeners are wrapped so failures disable only that tracker.
    const add = (target, eventName, handler, options, trackerKey) => {
      if (!target || typeof target.addEventListener !== "function") return;
      try {
        target.addEventListener(eventName, handler, options);
        this._listeners.push({ target, eventName, handler, options });
      } catch (e) {
        if (trackerKey) this._trackerEnabled[trackerKey] = false;
        if (this._config.debug) {
          // eslint-disable-next-line no-console
          console.warn(`[EmotionEngine] listener install failed: ${eventName}`, e);
        }
      }
    };

    // Mouse
    add(window, "mousemove", this._onMouseMove, { passive: true }, "mouse");

    // Keyboard
    add(window, "keydown", this._onKeyDown, { passive: true }, "keyboard");

    // Tabs (visibility + focus/blur)
    add(document, "visibilitychange", this._onVisibility, undefined, "tabs");
    add(window, "focus", this._onFocus, { passive: true }, "tabs");
    add(window, "blur", this._onBlur, { passive: true }, "tabs");

    // Scroll
    add(window, "scroll", this._onScroll, { passive: true }, "scroll");
  }

  _removeAllListeners() {
    for (const l of this._listeners) {
      try {
        l.target.removeEventListener(l.eventName, l.handler, l.options);
      } catch {
        // ignore
      }
    }
    this._listeners = [];
  }

  _markInteraction() {
    const t = nowMs();
    this._lastInteractionMs = t;

    if (!this._calibrated && t <= this._calibrationEndMs) {
      this._cal.interactionCount += 1;
    }
  }

  _onMouseMove(e) {
    if (!this._running || !this._trackerEnabled.mouse) return;
    try {
      this._markInteraction();

      const t = nowMs();
      const x = typeof e?.clientX === "number" ? e.clientX : null;
      const y = typeof e?.clientY === "number" ? e.clientY : null;

      if (x == null || y == null) return;

      if (this._mouse.lastX != null && this._mouse.lastY != null) {
        const dx = x - this._mouse.lastX;
        const dy = y - this._mouse.lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this._mouse.distPxSinceTick += dist;
        this._mouse.movesSinceTick += 1;

        if (!this._calibrated && t <= this._calibrationEndMs) {
          const dt = t - (this._mouse.lastMoveMs || t);
          // Only count time if it advances; avoid weird zero/negative dt.
          if (dt > 0) this._cal.mouseMs += dt;
          this._cal.mouseDistPx += dist;
        }
      }

      this._mouse.lastX = x;
      this._mouse.lastY = y;
      this._mouse.lastMoveMs = t;
    } catch (e2) {
      this._trackerEnabled.mouse = false;
      if (this._config.debug) {
        // eslint-disable-next-line no-console
        console.warn("[EmotionEngine] mouse tracker disabled:", e2);
      }
    }
  }

  _onKeyDown() {
    if (!this._running || !this._trackerEnabled.keyboard) return;
    try {
      this._markInteraction();
      this._keyboard.keysSinceTick += 1;

      const t = nowMs();
      if (!this._calibrated && t <= this._calibrationEndMs) {
        this._cal.keyCount += 1;
      }
    } catch (e) {
      this._trackerEnabled.keyboard = false;
      if (this._config.debug) {
        // eslint-disable-next-line no-console
        console.warn("[EmotionEngine] keyboard tracker disabled:", e);
      }
    }
  }

  _onVisibility() {
    if (!this._running || !this._trackerEnabled.tabs) return;
    try {
      this._markInteraction();
      const hidden = Boolean(document?.hidden);
      // Count a switch when state toggles.
      if (hidden !== this._tabs.hidden) {
        this._tabs.switchesSinceTick += 1;
      }
      this._tabs.hidden = hidden;
    } catch (e) {
      this._trackerEnabled.tabs = false;
      if (this._config.debug) {
        // eslint-disable-next-line no-console
        console.warn("[EmotionEngine] tabs tracker disabled:", e);
      }
    }
  }

  _onFocus() {
    if (!this._running || !this._trackerEnabled.tabs) return;
    try {
      this._markInteraction();
      this._tabs.switchesSinceTick += 1;
      this._tabs.hidden = false;
    } catch (e) {
      this._trackerEnabled.tabs = false;
    }
  }

  _onBlur() {
    if (!this._running || !this._trackerEnabled.tabs) return;
    try {
      this._markInteraction();
      this._tabs.switchesSinceTick += 1;
    } catch (e) {
      this._trackerEnabled.tabs = false;
    }
  }

  _onScroll() {
    if (!this._running || !this._trackerEnabled.scroll) return;
    try {
      this._markInteraction();
      // Use scrollY deltas if available; otherwise just count scroll events.
      const t = nowMs();
      const y = typeof window?.scrollY === "number" ? window.scrollY : null;
      const prevY = this._scroll._prevY;
      if (y != null && typeof prevY === "number") {
        const dy = Math.abs(y - prevY);
        this._scroll.pxSinceTick += dy;
        this._scroll.eventsSinceTick += 1;

        if (!this._calibrated && t <= this._calibrationEndMs) {
          const dt = t - (this._scroll._prevT || t);
          if (dt > 0) this._cal.scrollMs += dt;
          this._cal.scrollPx += dy;
        }
      } else {
        this._scroll.eventsSinceTick += 1;
      }
      this._scroll._prevY = y;
      this._scroll._prevT = t;
    } catch (e) {
      this._trackerEnabled.scroll = false;
      if (this._config.debug) {
        // eslint-disable-next-line no-console
        console.warn("[EmotionEngine] scroll tracker disabled:", e);
      }
    }
  }

  _tick() {
    if (!this._running) return;

    const t = nowMs();
    const dtMs = Math.max(1, t - this._lastTickMs);
    this._lastTickMs = t;

    // Finalize calibration once the window ends.
    if (!this._calibrated && t >= this._calibrationEndMs) {
      this._finalizeCalibration();
    }

    // If manual override is active, keep mood forced but still compute scores for visibility/debug.
    const overrideActive = this._forcedMood && t < this._forcedUntilMs;

    const scores = this._computeScores({ dtMs, now: t });
    this._lastScores = scores;

    if (overrideActive) {
      // Keep forced mood locked, but we still emit transitions if forceMood changed it already.
      this._mood = this._forcedMood;
      return;
    }

    // Default state requirement: if insufficient data, remain RELAXED.
    if (!this._calibrated || !scores || !Number.isFinite(scores.RELAXED)) {
      this._setMood(MOODS.RELAXED, { reason: "insufficientData" });
      return;
    }

    const nextMood = this._pickMood(scores);
    this._setMood(nextMood, { reason: "scoring" });
  }

  _finalizeCalibration() {
    // Calibration phase: compute baselines for dynamic thresholds.
    const durationMs = Math.max(1, this._config.calibrationMs);
    const durationS = durationMs / 1000;

    // Mouse speed (px/s)
    const mouseSpeed =
      this._cal.mouseMs > 0 ? (this._cal.mouseDistPx / (this._cal.mouseMs / 1000)) : this._cal.mouseDistPx / durationS;

    // Typing speed (keys/s)
    const typingSpeed = this._cal.keyCount / durationS;

    // Interaction frequency (events/s)
    const interactionsPerS = this._cal.interactionCount / durationS;

    // Scroll speed (px/s)
    const scrollSpeed =
      this._cal.scrollMs > 0 ? (this._cal.scrollPx / (this._cal.scrollMs / 1000)) : this._cal.scrollPx / durationS;

    // Store baselines; ensure non-zero floors to avoid division weirdness.
    this._baseline.mouseSpeedPxPerS = Math.max(1, mouseSpeed || 0);
    this._baseline.typingKeysPerS = Math.max(0.2, typingSpeed || 0);
    this._baseline.interactionsPerS = Math.max(0.2, interactionsPerS || 0);
    this._baseline.scrollPxPerS = Math.max(1, scrollSpeed || 0);

    this._calibrated = true;
  }

  _computeScores({ dtMs, now }) {
    // Convert tick accumulators into per-second rates.
    const dtS = dtMs / 1000;
    const mouseSpeedPxPerS = this._trackerEnabled.mouse ? this._mouse.distPxSinceTick / dtS : 0;
    const typingKeysPerS = this._trackerEnabled.keyboard ? this._keyboard.keysSinceTick / dtS : 0;
    const tabSwitchesPerS = this._trackerEnabled.tabs ? this._tabs.switchesSinceTick / dtS : 0;
    const scrollPxPerS = this._trackerEnabled.scroll ? this._scroll.pxSinceTick / dtS : 0;

    // Reset tick counters
    this._mouse.distPxSinceTick = 0;
    this._mouse.movesSinceTick = 0;
    this._keyboard.keysSinceTick = 0;
    this._tabs.switchesSinceTick = 0;
    this._scroll.pxSinceTick = 0;
    this._scroll.eventsSinceTick = 0;

    // Idle: how long since any interaction
    const idleMs = Math.max(0, now - this._lastInteractionMs);

    // Dynamic thresholds: use calibration baselines once available; otherwise keep it gentle.
    // These multipliers are tuned to be demo-reactive without being chaotic.
    const baseMouse = this._baseline.mouseSpeedPxPerS ?? 120; // only used pre-calibration
    const baseTyping = this._baseline.typingKeysPerS ?? 1.2;
    const baseInteract = this._baseline.interactionsPerS ?? 1.0;
    const baseScroll = this._baseline.scrollPxPerS ?? 250;

    // Normalizations (0..1). We clamp to prevent any single signal from exploding.
    const mouseHigh = clamp01(mouseSpeedPxPerS / (baseMouse * 2.2));
    const mouseLow = clamp01(1 - mouseSpeedPxPerS / (baseMouse * 1.2));

    const typingHigh = clamp01(typingKeysPerS / (baseTyping * 2.5));
    const typingLow = clamp01(1 - typingKeysPerS / (baseTyping * 1.3));

    const tabsHigh = clamp01(tabSwitchesPerS / 0.25); // ~1 switch / 4s feels "high"
    const tabsLow = clamp01(1 - tabSwitchesPerS / 0.08);

    const scrollHigh = clamp01(scrollPxPerS / (baseScroll * 2.2));
    const scrollLow = clamp01(1 - scrollPxPerS / (baseScroll * 1.2));

    const idleHigh = clamp01(idleMs / 15000); // 15s+ = strongly idle
    const idleLow = clamp01(1 - idleMs / 5000); // <5s = active

    // Interaction frequency (used as a stabilizer)
    const interactionsPerS = (mouseHigh + typingHigh + scrollHigh) / 3;
    const interactionHigh = clamp01(interactionsPerS / clamp01(baseInteract * 1.2));

    // Weighted scoring system (prevents dominance).
    // Each signal contributes at most its weight * 100 points across moods.
    const WEIGHTS = {
      mouse: 0.25,
      keyboard: 0.2,
      tabs: 0.2,
      idle: 0.2,
      scroll: 0.15,
    };

    const score = {
      RELAXED: 0,
      FOCUSED: 0,
      STRESSED: 0,
      TIRED: 0,
    };

    // Mouse (25%)
    // Fast mouse = stress/engagement; steady/slow mouse = relaxed.
    this._applySignal(score, WEIGHTS.mouse, {
      RELAXED: 0.65 * mouseLow,
      FOCUSED: 0.55 * mouseHigh,
      STRESSED: 0.75 * mouseHigh,
      TIRED: 0.25 * mouseLow,
    });

    // Keyboard (20%)
    // High typing = focused or stressed; low typing slightly relaxed/tired.
    this._applySignal(score, WEIGHTS.keyboard, {
      RELAXED: 0.5 * typingLow,
      FOCUSED: 0.9 * typingHigh,
      STRESSED: 0.6 * typingHigh,
      TIRED: 0.55 * typingLow,
    });

    // Tabs (20%)
    // Frequent switching correlates with distraction/stress; low switching supports focus/relaxed.
    this._applySignal(score, WEIGHTS.tabs, {
      RELAXED: 0.55 * tabsLow,
      FOCUSED: 0.55 * tabsLow,
      STRESSED: 0.85 * tabsHigh,
      TIRED: 0.35 * tabsHigh,
    });

    // Idle (20%)
    // Extended idle suggests tired/relaxed; very active suggests focus/stress.
    this._applySignal(score, WEIGHTS.idle, {
      RELAXED: 0.75 * idleHigh + 0.15 * idleLow,
      FOCUSED: 0.35 * idleLow,
      STRESSED: 0.25 * idleLow,
      TIRED: 0.9 * idleHigh,
    });

    // Scroll (15%)
    // Moderate scrolling suggests engagement; frantic scrolling suggests stress; no scroll slightly relaxed.
    this._applySignal(score, WEIGHTS.scroll, {
      RELAXED: 0.45 * scrollLow,
      FOCUSED: 0.55 * scrollHigh,
      STRESSED: 0.45 * scrollHigh,
      TIRED: 0.25 * scrollLow,
    });

    // Stabilizer: if user is very active overall, downweight "TIRED" slightly.
    const tiredPenalty = 10 * interactionHigh; // up to -10
    score.TIRED = Math.max(0, score.TIRED - tiredPenalty);

    // Time-aware context biases
    this._applyTimeBias(score);

    // Normalize to 0..100 range-ish (weights sum to 1, but per-signal mapping can exceed 1.0).
    // Clamp for safety and demo stability.
    for (const k of Object.keys(score)) {
      score[k] = clamp(score[k], 0, 100);
    }

    return score;
  }

  _applySignal(score, weight, contributions) {
    // Convert contributions (0..1-ish) into points capped by the signal weight.
    const cap = weight * 100;

    // Normalize contributions so this signal can't dominate:
    // scale such that max contribution across moods equals cap.
    const raw = {
      RELAXED: clamp01(contributions.RELAXED ?? 0),
      FOCUSED: clamp01(contributions.FOCUSED ?? 0),
      STRESSED: clamp01(contributions.STRESSED ?? 0),
      TIRED: clamp01(contributions.TIRED ?? 0),
    };
    const maxRaw = Math.max(raw.RELAXED, raw.FOCUSED, raw.STRESSED, raw.TIRED, 0.0001);
    const scale = cap / maxRaw;

    score.RELAXED += raw.RELAXED * scale;
    score.FOCUSED += raw.FOCUSED * scale;
    score.STRESSED += raw.STRESSED * scale;
    score.TIRED += raw.TIRED * scale;
  }

  _applyTimeBias(score) {
    const hour = wallClockHour();
    if (hour == null) return;

    // Morning (6am–11am): slight RELAXED bias
    if (hour >= 6 && hour < 11) {
      score.RELAXED += 4;
    }

    // 2pm–4pm: increase TIRED slightly
    if (hour >= 14 && hour < 16) {
      score.TIRED += 6;
    }

    // After 11pm: strongly bias toward TIRED
    if (hour >= 23 || hour < 3) {
      score.TIRED += 18;
      // Also soften stress a touch late-night (common demo perception)
      score.STRESSED = Math.max(0, score.STRESSED - 4);
    }
  }

  _pickMood(scores) {
    // Keep it stable: require a small margin to change moods.
    const current = this._mood || MOODS.RELAXED;
    const entries = Object.entries(scores);
    entries.sort((a, b) => b[1] - a[1]);
    const [bestMood, bestScore] = entries[0] ?? [MOODS.RELAXED, 0];
    const currentScore = scores[current] ?? 0;

    // If insufficient separation, stick to current mood.
    if (bestMood !== current && bestScore < currentScore + 6) {
      return current;
    }

    return bestMood in MOODS ? bestMood : MOODS.RELAXED;
  }

  _setMood(nextMood, meta = {}) {
    const mood = nextMood ?? MOODS.RELAXED;
    if (mood === this._mood) return;

    const prev = this._mood;
    this._mood = mood;

    if (this._config.debug) {
      // eslint-disable-next-line no-console
      console.log("[EmotionEngine] moodChanged:", prev, "→", mood, meta);
    }

    this._emitter.emit("moodChanged", {
      from: prev,
      to: mood,
      at: Date.now(),
      meta,
      scores: this._lastScores ? { ...this._lastScores } : null,
    });
  }
}

export default EmotionEngine;
