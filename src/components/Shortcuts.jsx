import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Pencil } from 'lucide-react';
import { storageGet, storageSet, getTopSites, getFaviconUrl, openUrl } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

export default function Shortcuts({ clutterLevel }) {
  const [shortcuts, setShortcuts] = useState([]);
  const [editMode, setEditMode]   = useState(false);
  const [adding, setAdding]       = useState(false);
  const [newName, setNewName]     = useState('');
  const [newUrl, setNewUrl]       = useState('');
  const [loaded, setLoaded]       = useState(false);

  // Load from storage; on first run seed from topSites
  useEffect(() => {
    storageGet(['shortcuts_v2']).then(async (data) => {
      if (data.shortcuts_v2) {
        setShortcuts(data.shortcuts_v2);
        setLoaded(true);
      } else {
        // First run — seed from top sites
        const sites = await getTopSites();
        const seeded = sites.slice(0, 8).map((s, i) => ({
          id: `ts${i}`,
          name: getShortLabel(s.title, s.url),
          url: s.url,
        }));
        setShortcuts(seeded);
        storageSet({ shortcuts_v2: seeded });
        setLoaded(true);
      }
    });
  }, []);

  const save = (updated) => {
    setShortcuts(updated);
    storageSet({ shortcuts_v2: updated });
  };

  const remove = (id) => save(shortcuts.filter((s) => s.id !== id));

  const addShortcut = () => {
    const rawUrl = newUrl.trim();
    if (!rawUrl) return;
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const name = newName.trim() || getShortLabel('', url);
    save([...shortcuts, { id: `c${Date.now()}`, name, url }]);
    setNewName('');
    setNewUrl('');
    setAdding(false);
  };

  if (clutterLevel === 'none' || !loaded) return null;

  return (
    <Wrapper>
      <ShortcutRow>
        <AnimatePresence initial={false}>
          {shortcuts.map((sc, i) => (
            <motion.div
              key={sc.id}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ delay: i * 0.03, type: 'spring', damping: 20, stiffness: 260 }}
              className="sc-wrapper"
            >
              <button
                className="sc-tile"
                onClick={() => !editMode && openUrl(sc.url, false)}
                title={sc.url}
              >
                <div className="sc-icon-ring">
                  <img
                    src={getFaviconUrl(sc.url)}
                    alt={sc.name}
                    className="sc-favicon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="sc-initial" style={{ display: 'none' }}>
                    {(sc.name?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <span className="sc-label">{sc.name}</span>
              </button>

              {editMode && (
                <motion.button
                  className="sc-remove"
                  onClick={() => remove(sc.id)}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  title="Remove"
                >
                  <X size={9} />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add tile */}
        {!adding ? (
          <motion.div
            key="add-btn"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sc-wrapper"
          >
            <button
              className="sc-tile sc-add"
              onClick={() => { setAdding(true); setEditMode(false); }}
              title="Add shortcut"
            >
              <div className="sc-icon-ring sc-add-ring">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <span className="sc-label">Add</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="add-form"
          >
            <input
              autoFocus
              placeholder="Site name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="add-input"
            />
            <input
              placeholder="URL (e.g. github.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addShortcut();
                if (e.key === 'Escape') setAdding(false);
              }}
              className="add-input"
            />
            <div className="add-row">
              <button className="add-confirm" onClick={addShortcut}>
                <Check size={13} /> Add
              </button>
              <button className="add-cancel" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
        {/* Edit toggle — inline with Add */}
        {!adding && (
          <div className="sc-wrapper">
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`sc-tile sc-edit ${editMode ? 'sc-edit-active' : ''}`}
              title={editMode ? 'Done editing' : 'Edit shortcuts'}
            >
              <div className={`sc-icon-ring sc-edit-ring ${editMode ? 'sc-edit-ring-active' : ''}`}>
                {editMode ? <Check size={18} strokeWidth={2.5} /> : <Pencil size={16} strokeWidth={2} />}
              </div>
              <span className="sc-label">{editMode ? 'Done' : 'Edit'}</span>
            </button>
          </div>
        )}
      </ShortcutRow>
    </Wrapper>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getShortLabel(title, url) {
  if (title && title.trim()) {
    // Strip common suffixes like " - Google Search", " | YouTube" etc.
    const cleaned = title.replace(/\s*[-|–]\s*.+$/, '').trim();
    if (cleaned.length > 0 && cleaned.length <= 16) return cleaned;
  }
  try {
    return new URL(url).hostname.replace('www.', '').split('.')[0];
  } catch {
    return url;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
`;

const ShortcutRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 700px;

  .sc-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Tile ── */
  .sc-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.4rem 0.5rem;
    border-radius: 14px;
    transition: background 0.18s, transform 0.15s;
    color: #fff;
    width: 72px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    &:active { transform: scale(0.93); }
  }

  /* ── Icon ring ── */
  .sc-icon-ring {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow:
      inset 0 1px 1px rgba(255,255,255,0.3),
      0 4px 16px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    flex-shrink: 0;

    .sc-tile:hover & {
      border-color: rgba(255,255,255,0.38);
      box-shadow:
        inset 0 1px 1px rgba(255,255,255,0.35),
        0 8px 24px rgba(0,0,0,0.35);
    }
  }

  .sc-favicon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .sc-initial {
    width: 100%;
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.75);
  }

  /* ── Label ── */
  .sc-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.75);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 68px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  }

  /* ── Add tile ── */
  .sc-add-ring {
    background: rgba(255, 255, 255, 0.08);
    border: 2px dashed rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.45);

    .sc-add:hover & {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.45);
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .sc-add .sc-label {
    color: rgba(255, 255, 255, 0.4);
  }

  /* ── Edit tile ── */
  .sc-edit-ring {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.4);

    .sc-edit:hover & {
      background: rgba(255, 255, 255, 0.13);
      border-color: rgba(255, 255, 255, 0.35);
      color: rgba(255, 255, 255, 0.75);
    }
  }

  .sc-edit-ring-active {
    background: rgba(74, 222, 128, 0.12);
    border-color: rgba(74, 222, 128, 0.4);
    color: #4ade80;
  }

  .sc-edit .sc-label {
    color: rgba(255, 255, 255, 0.4);
  }

  .sc-edit-active .sc-label {
    color: #4ade80;
  }

  /* ── Remove badge ── */
  .sc-remove {
    position: absolute;
    top: 0;
    right: 4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    border: 1.5px solid rgba(255,255,255,0.3);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: background 0.15s, transform 0.15s;

    &:hover { background: #dc2626; transform: scale(1.15); }
  }

  /* ── Add form ── */
  .add-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 0.75rem;
    width: 200px;
    align-self: center;
  }

  .add-input {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 9px;
    padding: 0.4rem 0.65rem;
    color: #fff;
    font-size: 0.8rem;
    outline: none;
    font-family: inherit;

    &::placeholder { color: rgba(255, 255, 255, 0.3); }

    &:focus {
      border-color: rgba(255, 255, 255, 0.28);
      background: rgba(255, 255, 255, 0.12);
    }
  }

  .add-row {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.1rem;
  }

  .add-confirm {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.18);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.35rem;
    cursor: pointer;
    transition: background 0.2s;
    font-family: inherit;

    &:hover { background: rgba(255, 255, 255, 0.3); }
  }

  .add-cancel {
    flex: 1;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.45);
    font-size: 0.78rem;
    padding: 0.35rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;

    &:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
  }
`;

// ─── Wrapper (outer) ──────────────────────────────────────────────────────────
// The .edit-btn class is used by the <button> inside Wrapper in the component.
// Since Wrapper is a flex column, we add it here too.

// NOTE: We already declared Wrapper above — we extend it by adding the CSS rule
// for .edit-btn directly inside the ShortcutRow template. The Wrapper div just
// needs `align-items: center; gap: 0.45rem;` (already set).
// The edit button uses global inline styles instead:

// ─── Edit button (Shortcuts bottom) ─────────────────────────────────────────
// Rendered via a normal button inside Wrapper — styles are injected below via
// the global .edit-btn class scoped to Wrapper.
