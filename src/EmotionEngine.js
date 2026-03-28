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
 * - Mouse: 30%  (speed + erratic direction changes)
 * - Keyboard: 25%
 * - Tabs (visibility/focus): 20%
 * - Idle: 15%
 * - Scroll: 10%
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
   * @param {boolean} [config.debug=false] - logs scores every tick + mood transitions
   * @param {number} [config.calibrationMs=6000] - baseline collection window (shorter = faster demo)
   * @param {number} [config.manualOverrideMs=12000] - override duration
   * @param {number} [config.tickMs=400] - scoring tick cadence (faster = more reactive)
   */
  constructor(config = {}) {
    this._config = {
      debug: Boolean(config.debug),
      // Reduced calibration to 6s so demo starts reacting faster
      calibrationMs: clamp(config.calibrationMs ?? 6000, 3000, 15000),
      manualOverrideMs: clamp(config.manualOverrideMs ?? 12000, 10000, 15000),
      // Faster tick = more reactive
      tickMs: clamp(config.tickMs ?? 400, 200, 2000),
    };

    this._emitter = new Emitter();

    this._running = false;
    this._destroyed = false;

    this._mood = MOODS.RELAXED;
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

    // Mood hold time — prevents switching more than once per 60 seconds
    this._lastMoodChangeTime = 0;

    // Interaction debounce — prevents micro-events from resetting idle
    this._lastInteractionUpdate = 0;

    this._mouse = {
      lastX: null,
      lastY: null,
      lastMoveMs: 0,
      distPxSinceTick: 0,
      movesSinceTick: 0,
      // Direction change tracking (ERRATIC DETECTION)
      lastAngle: null,
      directionChangesInWindow: 0,     // changes in current 1-second window
      directionWindowStartMs: 0,
      mouseDirectionChangesPerS: 0,    // exported metric
    };

    this._keyboard = {
      keysSinceTick: 0,
      backspaceCount: 0,   // PART 1: track correction keys
      totalKeyCount: 0,    // PART 1: track all key presses
    };

    // PART 1: Typing consistency — rolling window of typingKeysPerS per tick
    this._typingHistory = [];   // last N typingKeysPerS values
    this._TYPING_HISTORY_LEN = 8; // ~3.2s of history at 400ms/tick

    // PART 2: Sliding-window validation timestamp — reset when best mood matches current
    this._moodValidationStartTime = 0;

    this._tabs = {
      switchesSinceTick: 0,
      hidden: false,
    };

    this._scroll = {
      pxSinceTick: 0,
      eventsSinceTick: 0,
      // Scroll reversal detection
      lastScrollDir: 0,    // +1 down, -1 up
      reversalsSinceTick: 0,
    };

    // Calibration aggregators
    this._cal = {
      mouseDistPx: 0,
      mouseMs: 0,
      keyCount: 0,
      interactionCount: 0,
      scrollPx: 0,
      scrollMs: 0,
    };

    // ── Momentum buffer ──────────────────────────────────────────────────────
    // Keep last N score snapshots; average before picking mood.
    this._scoreHistory = [];   // array of { RELAXED, FOCUSED, STRESSED, TIRED }
    this._HISTORY_LEN = 5;    // smooth over last 5 ticks (~2s at 400ms/tick)

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
    this._mouse.directionWindowStartMs = this._startMs;

    this._mood = MOODS.RELAXED;
    this._lastMood = MOODS.RELAXED;

    this._installListeners();

    // Main scoring loop
    this._tickInterval = setInterval(() => {
      try {
        this._tick();
      } catch (e) {
        if (this._config.debug) {
          // eslint-disable-next-line no-console
          console.warn("[EmotionEngine] tick failed (continuing):", e);
        }
      }
    }, this._config.tickMs);

    // Debug loop: fires every tick for real-time visibility
    if (this._config.debug) {
      this._debugInterval = setInterval(() => {
        try {
          const s = this.getState();
          // eslint-disable-next-line no-console
          console.log(
            "[EmotionEngine]",
            `mouseSpeed=${s.scores?._mouseSpeed?.toFixed(1)}px/s`,
            `dirChanges=${this._mouse.mouseDirectionChangesPerS?.toFixed(2)}/s`,
            `erratic=${s.scores?._erraticFactor?.toFixed(2)}`,
            "scores:", {
              RELAXED: s.scores?.RELAXED?.toFixed(1),
              FOCUSED: s.scores?.FOCUSED?.toFixed(1),
              STRESSED: s.scores?.STRESSED?.toFixed(1),
              TIRED: s.scores?.TIRED?.toFixed(1),
            },
            "→ mood:", s.mood,
            "calibrated:", s.calibrated,
          );
        } catch {
          // ignore
        }
      }, 1000);
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
    this._scoreHistory = [];
  }

  _installListeners() {
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

    add(window, "mousemove", this._onMouseMove, { passive: true }, "mouse");
    add(window, "keydown", this._onKeyDown, { passive: true }, "keyboard");
    add(document, "visibilitychange", this._onVisibility, undefined, "tabs");
    add(window, "focus", this._onFocus, { passive: true }, "tabs");
    add(window, "blur", this._onBlur, { passive: true }, "tabs");
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
    const now = nowMs();

    // FIX 6: Debounce — ignore interactions less than 500ms apart
    if (now - this._lastInteractionUpdate < 500) return;

    this._lastInteractionUpdate = now;
    this._lastInteractionMs = now;

    if (!this._calibrated && now <= this._calibrationEndMs) {
      this._cal.interactionCount += 1;
    }
  }

  _onMouseMove(e) {
    if (!this._running || !this._trackerEnabled.mouse) return;
    try {
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

        // FIX 5: Only mark interaction for real movements (> 8px), ignoring micro-jitter
        if (dist > 8) {
          this._markInteraction();
        }

        // ── DIRECTION CHANGE DETECTION ─────────────────────────────────────
        if (dist > 2) {  // ignore micro-jitter < 2px
          const angle = Math.atan2(dy, dx);  // radians -π..π
          if (this._mouse.lastAngle != null) {
            let delta = Math.abs(angle - this._mouse.lastAngle);
            // Wrap to [0, π]
            if (delta > Math.PI) delta = 2 * Math.PI - delta;
            // A direction change is any turn > 45°
            if (delta > Math.PI / 4) {
              this._mouse.directionChangesInWindow += 1;
            }
          }
          this._mouse.lastAngle = angle;
        }

        // Reset direction window every 1 second and compute rate
        const windowDt = t - this._mouse.directionWindowStartMs;
        if (windowDt >= 1000) {
          this._mouse.mouseDirectionChangesPerS =
            this._mouse.directionChangesInWindow / (windowDt / 1000);
          this._mouse.directionChangesInWindow = 0;
          this._mouse.directionWindowStartMs = t;
        }
        // ──────────────────────────────────────────────────────────────────

        if (!this._calibrated && t <= this._calibrationEndMs) {
          const dt = t - (this._mouse.lastMoveMs || t);
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

  _onKeyDown(e) {
    if (!this._running || !this._trackerEnabled.keyboard) return;
    try {
      this._markInteraction();
      this._keyboard.keysSinceTick += 1;
      this._keyboard.totalKeyCount += 1;

      // PART 1: Track backspace separately for backspace-rate calculation
      if (e?.key === "Backspace" || e?.keyCode === 8) {
        this._keyboard.backspaceCount += 1;
      }

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
      const t = nowMs();
      const y = typeof window?.scrollY === "number" ? window.scrollY : null;
      const prevY = this._scroll._prevY;

      if (y != null && typeof prevY === "number") {
        const rawDy = y - prevY;
        const dy = Math.abs(rawDy);
        this._scroll.pxSinceTick += dy;
        this._scroll.eventsSinceTick += 1;

        // Scroll reversal detection
        const dir = rawDy > 0 ? 1 : rawDy < 0 ? -1 : 0;
        if (dir !== 0 && this._scroll.lastScrollDir !== 0 && dir !== this._scroll.lastScrollDir) {
          this._scroll.reversalsSinceTick += 1;
        }
        if (dir !== 0) this._scroll.lastScrollDir = dir;

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

    // If manual override is active, keep mood forced but still compute scores.
    const overrideActive = this._forcedMood && t < this._forcedUntilMs;

    const scores = this._computeScores({ dtMs, now: t });
    this._lastScores = scores;

    if (overrideActive) {
      this._mood = this._forcedMood;
      return;
    }

    // ── CALIBRATION GATE ──────────────────────────────────────────────────
    // Allow scoring even before calibration completes (reduced gate).
    // Only block if we have literally no baseline at all yet AND it's very early.
    const elapsed = t - this._startMs;
    const tooEarly = !this._calibrated && elapsed < 2000; // only block first 2s

    if (tooEarly || !scores || !Number.isFinite(scores.RELAXED)) {
      this._setMood(MOODS.RELAXED, { reason: "insufficientData" });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── MOMENTUM BUFFER ───────────────────────────────────────────────────
    // Smooth with last N snapshots before picking mood.
    this._scoreHistory.push({ ...scores });
    if (this._scoreHistory.length > this._HISTORY_LEN) {
      this._scoreHistory.shift();
    }

    const smoothed = { RELAXED: 0, FOCUSED: 0, STRESSED: 0, TIRED: 0 };
    for (const snap of this._scoreHistory) {
      for (const k of Object.keys(smoothed)) {
        smoothed[k] += snap[k] ?? 0;
      }
    }
    const n = this._scoreHistory.length;
    for (const k of Object.keys(smoothed)) {
      smoothed[k] /= n;
    }
    // ─────────────────────────────────────────────────────────────────────

    const nextMood = this._pickMood(smoothed);
    this._setMood(nextMood, { reason: "scoring" });
  }

  _finalizeCalibration() {
    const durationMs = Math.max(1, this._config.calibrationMs);
    const durationS = durationMs / 1000;

    const mouseSpeed =
      this._cal.mouseMs > 0
        ? this._cal.mouseDistPx / (this._cal.mouseMs / 1000)
        : this._cal.mouseDistPx / durationS;

    const typingSpeed = this._cal.keyCount / durationS;
    const interactionsPerS = this._cal.interactionCount / durationS;

    const scrollSpeed =
      this._cal.scrollMs > 0
        ? this._cal.scrollPx / (this._cal.scrollMs / 1000)
        : this._cal.scrollPx / durationS;

    // ── CALIBRATION IMPACT REDUCED BY 50% ─────────────────────────────────
    // Blend calibration baseline toward a fixed "normal" midpoint so calibration
    // doesn't make the system overly tolerant of aggressive movement.
    const FIXED_MOUSE  = 150;   // px/s "typical fast mouse"
    const FIXED_TYPING = 3.0;   // keys/s "moderate typing"
    const FIXED_SCROLL = 300;   // px/s
    const FIXED_INTERACT = 1.5;

    const blend = 0.5;  // 50% calibration, 50% fixed reference
    this._baseline.mouseSpeedPxPerS  = Math.max(1,   mouseSpeed       * blend + FIXED_MOUSE    * (1 - blend));
    this._baseline.typingKeysPerS    = Math.max(0.2, typingSpeed      * blend + FIXED_TYPING   * (1 - blend));
    this._baseline.interactionsPerS  = Math.max(0.2, interactionsPerS * blend + FIXED_INTERACT * (1 - blend));
    this._baseline.scrollPxPerS      = Math.max(1,   scrollSpeed      * blend + FIXED_SCROLL   * (1 - blend));

    this._calibrated = true;

    if (this._config.debug) {
      // eslint-disable-next-line no-console
      console.log("[EmotionEngine] calibration complete:", { ...this._baseline });
    }
  }

  _computeScores({ dtMs, now }) {
    const dtS = dtMs / 1000;

    // ── Per-second rates from tick accumulators ───────────────────────────
    const mouseSpeedPxPerS  = this._trackerEnabled.mouse    ? this._mouse.distPxSinceTick    / dtS : 0;
    const typingKeysPerS    = this._trackerEnabled.keyboard ? this._keyboard.keysSinceTick   / dtS : 0;
    const tabSwitchesPerS   = this._trackerEnabled.tabs     ? this._tabs.switchesSinceTick   / dtS : 0;
    const scrollPxPerS      = this._trackerEnabled.scroll   ? this._scroll.pxSinceTick       / dtS : 0;
    const scrollReversals   = this._scroll.reversalsSinceTick;

    // ── Erratic factor (direction changes → frustration) ─────────────────
    const dirChangesPerS     = this._mouse.mouseDirectionChangesPerS ?? 0;
    // Normalize: 0 = smooth, 1 = very erratic (≥ 8 direction changes/s)
    const erraticFactor      = clamp01(dirChangesPerS / 8);

    // PART 1: Backspace rate (rolling over lifetime; capped so very first press doesn't skew)
    const backspaceRate = this._keyboard.totalKeyCount > 5
      ? clamp01(this._keyboard.backspaceCount / this._keyboard.totalKeyCount)
      : 0;

    // PART 1: Typing consistency — variance of typingKeysPerS across last N ticks
    this._typingHistory.push(typingKeysPerS);
    if (this._typingHistory.length > this._TYPING_HISTORY_LEN) {
      this._typingHistory.shift();
    }
    let typingConsistency = 1; // default: perfectly consistent
    if (this._typingHistory.length >= 3) {
      const mean = this._typingHistory.reduce((s, v) => s + v, 0) / this._typingHistory.length;
      const variance = this._typingHistory.reduce((s, v) => s + (v - mean) ** 2, 0) / this._typingHistory.length;
      // Normalize variance: variance of ~4 (keys/s)^2 → inconsistency = 1
      typingConsistency = clamp01(1 - variance / 4);
    }

    // Reset tick counters
    this._mouse.distPxSinceTick = 0;
    this._mouse.movesSinceTick  = 0;
    this._keyboard.keysSinceTick = 0;
    this._tabs.switchesSinceTick = 0;
    this._scroll.pxSinceTick    = 0;
    this._scroll.eventsSinceTick = 0;
    this._scroll.reversalsSinceTick = 0;

    // Idle
    const idleMs = Math.max(0, now - this._lastInteractionMs);

    // ── Dynamic thresholds ────────────────────────────────────────────────
    // Use baselines post-calibration, otherwise fall back to fixed references
    const baseMouse   = this._baseline.mouseSpeedPxPerS  ?? 150;
    const baseTyping  = this._baseline.typingKeysPerS    ?? 3.0;
    const baseScroll  = this._baseline.scrollPxPerS      ?? 300;

    // ── Normalized signal dimensions (0..1) ───────────────────────────────
    // Thresholds are intentionally aggressive so signal reacts fast
    const mouseHigh  = clamp01(mouseSpeedPxPerS  / (baseMouse  * 1.2));
    const mouseLow   = clamp01(1 - mouseSpeedPxPerS  / (baseMouse  * 0.5));

    const typingHigh = clamp01(typingKeysPerS    / (baseTyping * 1.5));
    const typingLow  = clamp01(1 - typingKeysPerS    / (baseTyping * 0.6));

    const tabsHigh   = clamp01(tabSwitchesPerS   / 0.3);  // very sensitive
    const tabsLow    = clamp01(1 - tabSwitchesPerS   / 0.1);

    const scrollHigh = clamp01(scrollPxPerS      / (baseScroll * 1.2));

    // FIX 7: Improved idle thresholds — less sensitive so idle actually builds up
    const idleHigh   = clamp01(idleMs / 20000);  // full at 20s idle
    const idleLow    = clamp01(1 - idleMs / 8000); // active if < 8s idle
    // "moderate" idle: not too high, not too low → relaxed sweet spot
    const idleMod    = 1 - Math.abs(idleHigh - 0.3) / 0.3; // peaks ~6s idle

    // ── Scroll reversal signal ────────────────────────────────────────────
    const scrollReversalFactor = clamp01(scrollReversals / 3); // 3+ reversals/tick = high

    // ─────────────────────────────────────────────────────────────────────
    // DIRECT weighted contributions (NO over-normalization via _applySignal)
    // Each contribution is multiplied by signal weight × 100 directly.
    // One dominant signal CAN push a mood to win.
    // ─────────────────────────────────────────────────────────────────────

    const score = { RELAXED: 0, FOCUSED: 0, STRESSED: 0, TIRED: 0 };

    // ── MOUSE (30%) ───────────────────────────────────────────────────────
    {
      const W = 30;

      // STRESSED: fast + erratic
      score.STRESSED += W * mouseHigh * erraticFactor * 2.0;          // aggressive boost

      // FOCUSED: fast + smooth (low erratic)
      score.FOCUSED  += W * mouseHigh * (1 - erraticFactor) * 1.2;

      // RELAXED: only when mouse is genuinely slow
      // Penalty if fast
      if (mouseHigh < 0.4) {
        score.RELAXED += W * mouseLow * 0.7;
      }

      // TIRED: very little mouse activity
      score.TIRED    += W * mouseLow * 0.3;
    }

    // ── KEYBOARD (25%) ───────────────────────────────────────────────────
    {
      const W = 25;

      // FOCUSED: fast steady typing — but ONLY if consistent and low backspace
      // This is the primary FOCUSED qualifier from keyboard signal.
      score.FOCUSED  += W * typingHigh * 1.1;

      // STRESSED: fast typing with erratic mouse (frustration combo)
      score.STRESSED += W * typingHigh * erraticFactor * 1.5;

      // RELAXED: only when typing is genuinely low
      if (typingHigh < 0.3) {
        score.RELAXED += W * typingLow * 0.5;
      }

      // TIRED: low typing
      score.TIRED    += W * typingLow * 0.5;
    }

    // ── FOCUSED QUALIFICATION GATE (PART 1) ──────────────────────────────
    // FOCUSED requires ALL conditions to be simultaneously true:
    //   (a) steady consistent typing    → typingConsistency > 0.6
    //   (b) low correction rate         → backspaceRate < 0.15
    //   (c) smooth mouse                → erraticFactor < 0.3
    //   (d) not switching tabs          → tabSwitchesPerS < 0.1
    {
      const isSteadyTyping    = typingConsistency > 0.6;
      const isLowBackspace    = backspaceRate < 0.15;
      const isSmoothMouse     = erraticFactor < 0.3;
      const isLowTabSwitching = tabSwitchesPerS < 0.1;

      if (isSteadyTyping && isLowBackspace && isSmoothMouse && isLowTabSwitching && typingHigh > 0.2) {
        // All signals confirm FOCUSED → give a strong boost
        score.FOCUSED += 40;
      } else {
        // Partial failure → reduce FOCUSED so other moods can win cleanly
        const conditionsMet = [isSteadyTyping, isLowBackspace, isSmoothMouse, isLowTabSwitching]
          .filter(Boolean).length;
        // If only 2 or fewer conditions met, significantly penalize FOCUSED
        if (conditionsMet <= 2) {
          score.FOCUSED = Math.max(0, score.FOCUSED - 20);
        }
      }
    }

    // ── TABS (20%) ────────────────────────────────────────────────────────
    {
      const W = 20;

      // STRESSED: lots of tab switching
      score.STRESSED += W * tabsHigh * 1.8;                           // dominant signal

      // FOCUSED: very low tab switching (staying put)
      score.FOCUSED  += W * tabsLow  * 0.6;

      // RELAXED: mild tab activity only
      if (tabsHigh < 0.5) {
        score.RELAXED += W * tabsLow * 0.4;
      } else {
        // If tabsHigh > 0.5, penalize RELAXED hard
        score.RELAXED  = Math.max(0, score.RELAXED - W * tabsHigh * 0.8);
      }
    }

    // ── IDLE (15%) ────────────────────────────────────────────────────────
    {
      const W = 15;

      // TIRED: long idle
      score.TIRED    += W * idleHigh * 1.2;

      // FOCUSED: continuous activity (low idle)
      score.FOCUSED  += W * idleLow  * 0.5;

      // RELAXED: moderate idle only (not asleep, not hyper)
      score.RELAXED  += W * Math.max(0, idleMod) * 0.6;
    }

    // ── SCROLL (10%) ─────────────────────────────────────────────────────
    {
      const W = 10;

      // STRESSED: rapid scroll reversals
      score.STRESSED += W * scrollReversalFactor * 1.5;

      // FOCUSED: high sustained scrolling (reading)
      score.FOCUSED  += W * scrollHigh * 0.8;

      // RELAXED: little scroll activity
      if (scrollHigh < 0.3) {
        score.RELAXED += W * (1 - scrollHigh) * 0.3;
      }
    }

    // ── ADDITIONAL STRESSED MULTIPLIER (overall) ──────────────────────────
    // Boost STRESSED by 1.5x baseline so it can dominate quickly
    score.STRESSED = score.STRESSED * 1.5;

    // ── RELAXED GUARD ─────────────────────────────────────────────────────
    // RELAXED should only win when the user is genuinely calm.
    // Hard penalize if ANY high-activity signal is present.
    if (mouseHigh > 0.6) {
      score.RELAXED = Math.max(0, score.RELAXED - 15);
    }
    if (tabsHigh > 0.5) {
      score.RELAXED = Math.max(0, score.RELAXED - 10);
    }
    if (typingHigh > 0.5) {
      score.RELAXED = Math.max(0, score.RELAXED - 8);
    }

    // FIX 8: Force TIRED after 30s of true inactivity (override all scores)
    if (idleMs > 30000 && !this._forcedMood) {
      return {
        RELAXED: 10,
        FOCUSED: 0,
        STRESSED: 0,
        TIRED: 100,
        _mouseSpeed: mouseSpeedPxPerS,
        _erraticFactor: erraticFactor,
        _dirChanges: dirChangesPerS,
        _tabsHigh: tabsHigh,
        _idleMs: idleMs,
      };
    }

    // PART 5: Enriched debug logging — includes all FOCUSED qualifiers
    if (this._config.debug) {
      // eslint-disable-next-line no-console
      console.log("[EmotionEngine]", {
        mood: this._mood,
        idleMs,
        typingConsistency: typingConsistency.toFixed(3),
        backspaceRate:     backspaceRate.toFixed(3),
        erraticFactor:     erraticFactor.toFixed(3),
        tabSwitchesPerS:   tabSwitchesPerS.toFixed(3),
        scores: {
          RELAXED:  score.RELAXED.toFixed(1),
          FOCUSED:  score.FOCUSED.toFixed(1),
          STRESSED: score.STRESSED.toFixed(1),
          TIRED:    score.TIRED.toFixed(1),
        },
      });
    }

    // PART 3: Expose focused-qualifier metadata for debug overlay / _pickMood
    score._typingConsistency = typingConsistency;
    score._backspaceRate     = backspaceRate;

    // ── TIME-AWARE BIASES ─────────────────────────────────────────────────
    this._applyTimeBias(score);

    // ── Clamp all scores ──────────────────────────────────────────────────
    for (const k of Object.keys(score)) {
      score[k] = clamp(score[k], 0, 100);
    }

    // ── Attach debug metadata ─────────────────────────────────────────────
    score._mouseSpeed    = mouseSpeedPxPerS;
    score._erraticFactor = erraticFactor;
    score._dirChanges    = dirChangesPerS;
    score._tabsHigh      = tabsHigh;
    score._idleMs        = idleMs;
    score._tabSwitchesPerS = tabSwitchesPerS;

    return score;
  }

  // _applySignal is retained but unused by new code (kept for API compatibility).
  _applySignal(score, weight, contributions) {
    const cap = weight * 100;
    const raw = {
      RELAXED:  clamp01(contributions.RELAXED  ?? 0),
      FOCUSED:  clamp01(contributions.FOCUSED  ?? 0),
      STRESSED: clamp01(contributions.STRESSED ?? 0),
      TIRED:    clamp01(contributions.TIRED    ?? 0),
    };
    // Direct add (no normalization scale) — one signal CAN dominate
    score.RELAXED  += raw.RELAXED  * cap;
    score.FOCUSED  += raw.FOCUSED  * cap;
    score.STRESSED += raw.STRESSED * cap;
    score.TIRED    += raw.TIRED    * cap;
  }

  _applyTimeBias(score) {
    const hour = wallClockHour();
    if (hour == null) return;

    // Morning (6am–11am): slight RELAXED bias
    if (hour >= 6 && hour < 11) {
      score.RELAXED += 3;
    }

    // 2pm–4pm: increase TIRED slightly
    if (hour >= 14 && hour < 16) {
      score.TIRED += 5;
    }

    // After 11pm: strongly bias toward TIRED
    if (hour >= 23 || hour < 3) {
      score.TIRED   += 15;
      score.STRESSED = Math.max(0, score.STRESSED - 4);
    }
  }

  _pickMood(scores) {
    const current = this._mood || MOODS.RELAXED;
    const now = nowMs();

    // Momentum: add slight bias toward current mood so it doesn't drop out on noise
    scores[current] = (scores[current] ?? 0) + 10;

    // Pick best mood from (biased) score table
    const entries = Object.entries(scores).filter(([k]) => k in MOODS);
    entries.sort((a, b) => b[1] - a[1]);
    const [bestMood, bestScore] = entries[0] ?? [MOODS.RELAXED, 0];
    const currentScore = scores[current] ?? 0;

    // ── PART 2: SLIDING-WINDOW CONTINUOUS VALIDATION ─────────────────────
    // If behavior still supports current mood → reset validation clock and keep it.
    if (bestMood === current) {
      this._moodValidationStartTime = now;   // behavior is confirmed: restart timer
      return current;
    }

    // ── PART 3: RELAXED AUTO-FALLBACK GUARD ──────────────────────────────
    // RELAXED should NOT win if any strong competing signal exists.
    if (
      bestMood === "RELAXED" &&
      (scores.FOCUSED > 20 || scores.STRESSED > 20 || scores.TIRED > 20)
    ) {
      this._moodValidationStartTime = now;   // extend grace for current mood
      return current;
    }

    // Best mood differs from current — start (or continue) the 30s grace window.
    // Only switch after behavior has consistently disagreed for 30 full seconds.
    if (now - this._moodValidationStartTime < 30000) {
      // Still within grace — keep current mood, don't reset the clock
      return current;
    }

    // ── Hysteresis: challenger must still beat current by 15 points ───────
    if (bestScore < currentScore + 15) {
      this._moodValidationStartTime = now;   // close call → reset grace period
      return current;
    }

    // ── FOCUSED-specific guard ────────────────────────────────────────────
    // FIX 3 carry-over: RELAXED must not override STRESSED/FOCUSED if user
    // is still interacting (idle < 15s).
    const idleMs = Math.max(0, now - this._lastInteractionMs);
    if (
      (current === "STRESSED" || current === "FOCUSED") &&
      bestMood === "RELAXED" &&
      idleMs < 15000
    ) {
      this._moodValidationStartTime = now;
      return current;
    }

    // Behavior has disagreed long enough → allow the switch
    return bestMood in MOODS ? bestMood : MOODS.RELAXED;
  }

  _setMood(nextMood, meta = {}) {
    const mood = nextMood ?? MOODS.RELAXED;
    if (mood === this._mood) return;

    const prev = this._mood;
    this._mood = mood;

    // PART 2: Reset both the mood-change timestamp and the validation window
    // when a new mood is confirmed, so the new mood gets a fresh 30s validation clock.
    this._lastMoodChangeTime = nowMs();
    this._moodValidationStartTime = this._lastMoodChangeTime;

    if (this._config.debug) {
      // eslint-disable-next-line no-console
      console.log(`[EmotionEngine] 🎭 moodChanged: ${prev} → ${mood}`, meta);
    }

    const eventPayload = {
      from: prev,
      to: mood,
      at: Date.now(),
      meta,
      scores: this._lastScores ? { ...this._lastScores } : null,
    };

    this._emitter.emit("moodChanged", eventPayload);

    try {
      const domEvent = new CustomEvent("moodChanged", { detail: mood });
      window.dispatchEvent(domEvent);
    } catch (e) {
      try {
        window.moodChanged = mood;
      } catch {
        // ignore
      }
    }
  }
}

export default EmotionEngine;
