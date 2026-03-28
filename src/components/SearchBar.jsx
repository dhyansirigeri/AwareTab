import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { storageGet, storageSet, openUrl } from '../utils/chromeApi';
import styled from 'styled-components';

const ENGINES = {
  google: { label: 'Google', url: 'https://www.google.com/search?q=' },
  bing:   { label: 'Bing',   url: 'https://www.bing.com/search?q=' },
  ddg:    { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
};

export default function SearchBar({ searchEngine = 'google', onEngineChange }) {
  const [query, setQuery]         = useState('');
  const [engineKey, setEngineKey] = useState(searchEngine);
  const [dropOpen, setDropOpen]   = useState(false);
  const dropRef = useRef(null);

  // Sync prop → local state
  useEffect(() => { setEngineKey(searchEngine); }, [searchEngine]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Detect if it looks like a URL
    const isUrl = /^(https?:\/\/|www\.)/.test(q) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|$)/.test(q);
    const destination = isUrl
      ? (q.startsWith('http') ? q : `https://${q}`)
      : ENGINES[engineKey].url + encodeURIComponent(q);
    openUrl(destination, false);
  };

  const handleEngineSelect = async (key) => {
    setEngineKey(key);
    setDropOpen(false);
    await storageSet({ searchEngine: key });
    onEngineChange?.(key);
  };

  return (
    <Wrapper>
      <form onSubmit={handleSearch} className="search-form">
        {/* Engine Picker */}
        <div className="engine-picker" ref={dropRef}>
          <button
            type="button"
            className="engine-btn"
            onClick={() => setDropOpen((v) => !v)}
            title="Search engine"
          >
            <span className="engine-label">{ENGINES[engineKey].label[0]}</span>
            <ChevronDown size={12} className={`chevron ${dropOpen ? 'open' : ''}`} />
          </button>
          {dropOpen && (
            <div className="engine-dropdown">
              {Object.entries(ENGINES).map(([key, eng]) => (
                <button
                  key={key}
                  type="button"
                  className={`engine-item ${key === engineKey ? 'active' : ''}`}
                  onClick={() => handleEngineSelect(key)}
                >
                  {eng.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Icon */}
        <Search className="search-icon" size={18} />

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
          placeholder="Search the web..."
          className="search-input"
          autoFocus
        />
      </form>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 560px;
  margin-bottom: 2rem;
  position: relative;

  .search-form {
    display: flex;
    align-items: center;
    background: rgba(var(--theme-bg), 0.28);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(var(--theme-border), 0.25);
    border-radius: 9999px;
    padding: 0 1rem 0 0.5rem;
    transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);

    &:focus-within {
      background: rgba(var(--theme-bg), 0.42);
      border-color: rgba(var(--theme-border), 0.5);
      box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    }
  }

  .search-icon {
    color: rgba(var(--theme-text), 0.5);
    flex-shrink: 0;
    margin: 0 0.5rem;
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 1rem 0;
    color: rgb(var(--theme-text));
    font-size: 0.95rem;
    font-family: inherit;

    &::placeholder {
      color: rgba(var(--theme-text), 0.45);
    }
  }

  /* Engine picker */
  .engine-picker {
    position: relative;
    flex-shrink: 0;
  }

  .engine-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(var(--theme-text), 0.12);
    border: 1px solid rgba(var(--theme-border), 0.2);
    border-radius: 9999px;
    padding: 0.3rem 0.55rem;
    color: rgba(var(--theme-text), 0.8);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: background 0.2s;
    margin: 0.4rem 0.3rem;

    &:hover { background: rgba(var(--theme-text), 0.2); }
  }

  .engine-label {
    width: 12px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .chevron {
    transition: transform 0.2s;
    &.open { transform: rotate(180deg); }
  }

  .engine-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: rgba(15, 15, 20, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    overflow: hidden;
    z-index: 100;
    min-width: 130px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  }

  .engine-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.6rem 1rem;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.8);
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba(255,255,255,0.1); }
    &.active { color: #fff; font-weight: 600; background: rgba(255,255,255,0.08); }
  }
`;
