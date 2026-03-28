import React, { useState, useEffect } from 'react';
import { Settings, X, User, Search, Clock, Volume2, VolumeX, Layers, Lock } from 'lucide-react';
import { storageGet, storageSet } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

const ENGINES   = ['google', 'bing', 'ddg'];
const ENGINE_LABELS = { google: 'Google', bing: 'Bing', ddg: 'DuckDuckGo' };
const CLUTTER_LEVELS = ['none', 'minimal', 'full'];

const MOOD_OPTIONS = ['AUTO', 'RELAXED', 'FOCUSED', 'STRESSED', 'TIRED'];
const MOOD_LABELS = { 'AUTO': 'Auto', 'RELAXED': 'Relaxed', 'FOCUSED': 'Focused', 'STRESSED': 'Stressed', 'TIRED': 'Tired' };
const DURATION_OPTIONS = ['1h', '6h', 'EOD', 'forever'];
const DURATION_LABELS = { '1h': '1 Hour', '6h': '6 Hours', 'EOD': 'End of Day', 'forever': 'Until Changed' };

export default function UserSettings({ settings, onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [local, setLocal]   = useState(settings || {});

  // Sync from parent
  useEffect(() => { setLocal(settings || {}); }, [settings]);

  const updateMultiple = async (updates) => {
    const newLocal = { ...local, ...updates };
    setLocal(newLocal);
    await storageSet(newLocal);
    onSettingsChange?.(newLocal);
  };

  const update = async (key, value) => {
    updateMultiple({ [key]: value });
  };

  const handleMoodLockChange = (moodOption) => {
    const updates = { manualMood: moodOption };
    let duration = local.manualDuration || '1h';
    if (moodOption !== 'AUTO' && !local.manualDuration) {
      updates.manualDuration = '1h';
      duration = '1h';
    }

    let until = null;
    if (moodOption !== 'AUTO') {
      if (duration === '1h') until = Date.now() + 60 * 60 * 1000;
      else if (duration === '6h') until = Date.now() + 6 * 60 * 60 * 1000;
      else if (duration === 'EOD') {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        until = d.getTime();
      } else {
        until = 'forever';
      }
    }
    updates.manualMoodUntil = until;
    updateMultiple(updates);
  };

  const handleDurationChange = (duration) => {
    const updates = { manualDuration: duration };
    let until = null;
    if (local.manualMood && local.manualMood !== 'AUTO') {
      if (duration === '1h') until = Date.now() + 60 * 60 * 1000;
      else if (duration === '6h') until = Date.now() + 6 * 60 * 60 * 1000;
      else if (duration === 'EOD') {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        until = d.getTime();
      } else {
        until = 'forever';
      }
    }
    updates.manualMoodUntil = until;
    updateMultiple(updates);
  };

  return (
    <>
      <button
        className="settings-trigger"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(var(--theme-bg),0.3)',
          border: '1px solid rgba(var(--theme-border),0.3)',
          borderRadius: '999px',
          padding: '0.5rem 1.25rem',
          color: 'rgb(var(--theme-text))',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          fontSize: '0.85rem',
          fontWeight: 500,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--theme-bg),0.5)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(var(--theme-bg),0.3)'}
      >
        <Settings
          size={16}
          style={{
            transition: 'transform 0.5s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
        User settings
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
            <motion.div
              key="us-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="us-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ position: 'fixed', top: 0, right: 0, height: '100%', zIndex: 50 }}
            >
              <Panel>
                <div className="panel-header">
                  <div className="header-title">
                    <Settings size={17} />
                    <span>User Settings</span>
                  </div>
                  <button className="close-btn" onClick={() => setIsOpen(false)}>
                    <X size={19} />
                  </button>
                </div>

                <div className="panel-body">

                  {/* Name */}
                  <Section icon={<User size={15} />} label="Your name">
                    <input
                      type="text"
                      value={local.userName || ''}
                      onChange={(e) => update('userName', e.target.value)}
                      placeholder="e.g. Alex"
                      className="text-input"
                    />
                  </Section>

                  {/* Search Engine */}
                  <Section icon={<Search size={15} />} label="Search engine">
                    <SegmentRow
                      options={ENGINES}
                      labels={ENGINE_LABELS}
                      value={local.searchEngine || 'google'}
                      onChange={(v) => update('searchEngine', v)}
                    />
                  </Section>

                  {/* Clock Format */}
                  <Section icon={<Clock size={15} />} label="Clock format">
                    <SegmentRow
                      options={['12h', '24h']}
                      labels={{ '12h': '12-hour', '24h': '24-hour' }}
                      value={local.clockFormat || '12h'}
                      onChange={(v) => update('clockFormat', v)}
                    />
                  </Section>

                  {/* Ambient Sound */}
                  <Section label="Ambient sound" icon={local.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}>
                    <Toggle
                      value={local.soundEnabled !== false}
                      onChange={(v) => update('soundEnabled', v)}
                    />
                  </Section>

                  {/* Shortcut density */}
                  <Section icon={<Layers size={15} />} label="Shortcut density">
                    <SegmentRow
                      options={CLUTTER_LEVELS}
                      labels={{ none: 'Hidden', minimal: 'Minimal', full: 'Full' }}
                      value={local.clutterLevel || 'minimal'}
                      onChange={(v) => update('clutterLevel', v)}
                    />
                  </Section>

                  {/* Mood Lock */}
                  <Section icon={<Lock size={15} />} label="Mood Lock">
                    <SegmentRow
                      options={MOOD_OPTIONS}
                      labels={MOOD_LABELS}
                      value={local.manualMood || 'AUTO'}
                      onChange={handleMoodLockChange}
                    />
                    {local.manualMood && local.manualMood !== 'AUTO' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="setting-label" style={{ fontSize: '0.7rem', opacity: 0.7 }}>Lock Duration</div>
                        <SegmentRow
                          options={DURATION_OPTIONS}
                          labels={DURATION_LABELS}
                          value={local.manualDuration || '1h'}
                          onChange={handleDurationChange}
                        />
                      </div>
                    )}
                  </Section>

                </div>

                <div className="panel-footer">
                  <p className="footer-note">Changes are saved automatically.</p>
                </div>
              </Panel>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ icon, label, children }) {
  return (
    <div className="setting-section">
      <div className="setting-label">
        {icon && <span className="label-icon">{icon}</span>}
        {label}
      </div>
      {children}
    </div>
  );
}

function SegmentRow({ options, labels, value, onChange }) {
  return (
    <div className="segment-row">
      {options.map((opt) => (
        <button
          key={opt}
          className={`segment-btn ${value === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {labels?.[opt] || opt}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      className={`toggle-track ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

const Panel = styled.div`
  width: 320px;
  height: 100%;
  background: rgba(8, 8, 14, 0.9);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-left: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  color: #fff;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .close-btn {
    background: rgba(255,255,255,0.07);
    border: none;
    border-radius: 8px;
    padding: 0.35rem;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.14); color: #fff; }
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  }

  .setting-section {
    padding: 0.9rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);

    &:last-child { border-bottom: none; }
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.65rem;
  }

  .label-icon {
    display: flex;
    align-items: center;
    opacity: 0.7;
  }

  .text-input {
    width: 100%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.55rem 0.75rem;
    color: #fff;
    font-size: 0.88rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    box-sizing: border-box;

    &::placeholder { color: rgba(255,255,255,0.25); }
    &:focus {
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
    }
  }

  .segment-row {
    display: flex;
    background: rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
  }

  .segment-btn {
    flex: 1;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255,255,255,0.45);
    font-size: 0.78rem;
    font-weight: 500;
    padding: 0.45rem 0.25rem;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover { color: rgba(255,255,255,0.75); }
    &.active {
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-weight: 600;
    }
  }

  /* Toggle */
  .toggle-track {
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.15);
    cursor: pointer;
    position: relative;
    transition: background 0.25s, border-color 0.25s;

    &.on {
      background: rgba(74,222,128,0.35);
      border-color: rgba(74,222,128,0.5);
    }
  }

  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255,255,255,0.7);
    transition: transform 0.25s, background 0.25s;

    .on & {
      transform: translateX(20px);
      background: #4ade80;
    }
  }

  .panel-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .footer-note {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.25);
    text-align: center;
    margin: 0;
  }
`;
