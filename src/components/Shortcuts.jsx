import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { storageGet, storageSet, getFaviconUrl, openUrl } from '../utils/chromeApi';
import styled from 'styled-components';

const DEFAULT_SHORTCUTS = [
  { id: 's1', name: 'Spotify', url: 'https://www.spotify.com', social: 'spotify' },
  { id: 's2', name: 'Pinterest', url: 'https://www.pinterest.com', social: 'pinterest' },
  { id: 's3', name: 'Dribbble', url: 'https://dribbble.com', social: 'dribbble' },
  { id: 's4', name: 'Telegram', url: 'https://telegram.org', social: 'telegram' },
];

const BRAND_COLORS = {
  spotify:   { gradient: 'linear-gradient(135deg, #0f3d1f, #1db954, #0d2916)', border: 'rgba(29,185,84,0.6)' },
  pinterest: { gradient: 'linear-gradient(135deg, #3d0a0f, #bd081c, #4a0b12)', border: 'rgba(189,8,28,0.6)' },
  dribbble:  { gradient: 'linear-gradient(135deg, #3a0f24, #ea4c89, #4a0f2d)', border: 'rgba(234,76,137,0.6)' },
  telegram:  { gradient: 'linear-gradient(135deg, #0a1f2d, #0088cc, #0a2e44)', border: 'rgba(0,136,204,0.6)' },
};

const getDomainColor = (url) => {
  try {
    const h = new URL(url).hostname;
    let hash = 0;
    for (let i = 0; i < h.length; i++) hash = h.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return {
      gradient: `linear-gradient(135deg, hsl(${hue},60%,15%), hsl(${hue},70%,40%), hsl(${hue},60%,10%))`,
      border: `hsla(${hue},70%,50%,0.6)`,
    };
  } catch {
    return { gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: 'rgba(255,255,255,0.2)' };
  }
};

export default function Shortcuts({ clutterLevel }) {
  const [shortcuts, setShortcuts]       = useState([]);
  const [editMode, setEditMode]         = useState(false);
  const [adding, setAdding]             = useState(false);
  const [newName, setNewName]           = useState('');
  const [newUrl, setNewUrl]             = useState('');
  const [hovered, setHovered]           = useState(null);

  useEffect(() => {
    storageGet(['shortcuts']).then((data) => {
      setShortcuts(data.shortcuts || DEFAULT_SHORTCUTS);
    });
  }, []);

  const save = (updated) => {
    setShortcuts(updated);
    storageSet({ shortcuts: updated });
  };

  const removeShortcut = (id) => save(shortcuts.filter((s) => s.id !== id));

  const addShortcut = () => {
    if (!newUrl.trim()) return;
    const url = newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`;
    const name = newName.trim() || new URL(url).hostname.replace('www.', '');
    const newItem = { id: `s${Date.now()}`, name, url };
    save([...shortcuts, newItem]);
    setNewName('');
    setNewUrl('');
    setAdding(false);
  };

  if (clutterLevel === 'none') return null;

  return (
    <Wrapper>
      <ul className="shortcuts-list">
        {shortcuts.map((sc) => {
          const brand = sc.social && BRAND_COLORS[sc.social];
          const colors = brand || getDomainColor(sc.url);
          const favicon = !sc.social ? getFaviconUrl(sc.url) : null;
          const initial = (sc.name?.[0] || '?').toUpperCase();

          return (
            <li key={sc.id} className="shortcut-item">
              <a
                href={sc.url}
                onClick={(e) => { e.preventDefault(); openUrl(sc.url, false); }}
                className="shortcut-link"
                onMouseEnter={() => setHovered(sc.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  '--sc-gradient': colors.gradient,
                  '--sc-border': colors.border,
                }}
              >
                <div className="sc-filled" />
                {favicon ? (
                  <img
                    src={favicon}
                    alt={sc.name}
                    className="sc-favicon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="sc-initial" style={{ display: favicon ? 'none' : 'flex' }}>
                  {initial}
                </span>
                <div className="sc-shine" />
              </a>

              {editMode && (
                <button className="sc-remove" onClick={() => removeShortcut(sc.id)} title="Remove">
                  <X size={10} />
                </button>
              )}

              <div className="sc-tooltip">{sc.name}</div>
            </li>
          );
        })}

        {/* Add button */}
        {adding ? (
          <li className="add-form">
            <input
              autoFocus
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="add-input"
            />
            <input
              placeholder="URL (e.g. github.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addShortcut(); if (e.key === 'Escape') setAdding(false); }}
              className="add-input"
            />
            <div className="add-actions">
              <button className="add-confirm" onClick={addShortcut}>Add</button>
              <button className="add-cancel" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </li>
        ) : (
          <li className="shortcut-item">
            <button
              className="shortcut-link add-btn"
              onClick={() => { setAdding(true); setEditMode(false); }}
              title="Add shortcut"
            >
              <Plus size={22} />
            </button>
            <div className="sc-tooltip">Add</div>
          </li>
        )}
      </ul>

      {/* Edit toggle */}
      <button
        className={`edit-toggle ${editMode ? 'active' : ''}`}
        onClick={() => setEditMode((v) => !v)}
        title={editMode ? 'Done editing' : 'Edit shortcuts'}
      >
        {editMode ? 'Done' : 'Edit'}
      </button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  .shortcuts-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .shortcut-item {
    position: relative;
  }

  .sc-tooltip {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    color: #fff;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.2s, top 0.2s;
  }

  .shortcut-item:hover .sc-tooltip {
    opacity: 1;
    visibility: visible;
    top: -46px;
  }

  .shortcut-link {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 20%;
    color: #fff;
    background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    box-shadow:
      inset 0 1px 2px rgba(255,255,255,0.4),
      inset 0 -2px 6px rgba(0,0,0,0.15),
      0 6px 18px rgba(0,0,0,0.25);
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow:
        inset 0 1px 2px rgba(255,255,255,0.5),
        0 12px 28px rgba(0,0,0,0.35);
    }

    &:hover .sc-filled {
      height: 100%;
      top: 0;
    }

    &:active { transform: scale(0.96); }
  }

  .sc-filled {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0;
    background: var(--sc-gradient);
    background-size: 300% 300%;
    border: 1px solid var(--sc-border);
    border-radius: 20%;
    transition: height 0.3s ease-in-out, top 0.3s ease-in-out;
    z-index: 0;
    animation: gradShift 6s ease infinite;
  }

  @keyframes gradShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .sc-favicon {
    width: 26px;
    height: 26px;
    object-fit: contain;
    position: relative;
    z-index: 1;
    border-radius: 4px;
  }

  .sc-initial {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
  }

  .sc-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      120deg,
      rgba(255,255,255,0) 30%,
      rgba(255,255,255,0.4) 50%,
      rgba(255,255,255,0) 70%
    );
    transform: rotate(25deg) translateX(-100%);
    transition: transform 0.8s ease;
    z-index: 1;
    pointer-events: none;
  }

  .shortcut-link:hover .sc-shine {
    transform: rotate(25deg) translateX(100%);
  }

  .add-btn {
    background: rgba(255,255,255,0.1);
    border: 2px dashed rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.5);

    &:hover {
      background: rgba(255,255,255,0.18);
      color: rgba(255,255,255,0.85);
      border-color: rgba(255,255,255,0.4);
    }
  }

  .sc-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ef4444;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    animation: pop-in 0.15s ease;

    &:hover { background: #dc2626; }
  }

  @keyframes pop-in {
    from { transform: scale(0); }
    to { transform: scale(1); }
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 0.75rem;
    width: 200px;
  }

  .add-input {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px;
    padding: 0.4rem 0.65rem;
    color: #fff;
    font-size: 0.8rem;
    outline: none;

    &::placeholder { color: rgba(255,255,255,0.35); }
    &:focus { border-color: rgba(255,255,255,0.3); }
  }

  .add-actions {
    display: flex;
    gap: 0.4rem;
  }

  .add-confirm {
    flex: 1;
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.35rem;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.3); }
  }

  .add-cancel {
    flex: 1;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 7px;
    color: rgba(255,255,255,0.5);
    font-size: 0.78rem;
    padding: 0.35rem;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.08); color: #fff; }
  }

  .edit-toggle {
    margin-top: 0.25rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 999px;
    color: rgba(255,255,255,0.45);
    font-size: 0.68rem;
    padding: 0.2rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.05em;
    text-transform: uppercase;

    &:hover { background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.7); }
    &.active { background: rgba(255,100,100,0.15); border-color: rgba(255,100,100,0.3); color: rgba(255,150,150,0.9); }
  }
`;
