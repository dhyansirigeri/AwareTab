import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Folder } from 'lucide-react';
import { getBookmarks, getFaviconUrl, openUrl } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

export default function BookmarksPanel({ isOpen, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getBookmarks().then((bm) => {
        setBookmarks(bm);
        setLoading(false);
      });
      setTimeout(() => searchRef.current?.focus(), 250);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filtered = query
    ? bookmarks.filter(
        (bm) =>
          bm.title.toLowerCase().includes(query.toLowerCase()) ||
          bm.url.toLowerCase().includes(query.toLowerCase())
      )
    : bookmarks;

  const handleClick = (bm) => {
    openUrl(bm.url, false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="bm-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{ position: 'fixed', top: 0, right: 0, height: '100%', zIndex: 50 }}
          >
            <Panel>
              {/* Header */}
              <div className="panel-header">
                <div className="header-title">
                  <Folder size={18} style={{ opacity: 0.7 }} />
                  <span>Bookmarks</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="search-box">
                <Search size={14} className="search-icon" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search bookmarks..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Count */}
              <p className="bm-count">
                {loading ? 'Loading…' : `${filtered.length} bookmark${filtered.length !== 1 ? 's' : ''}`}
              </p>

              {/* List */}
              <div className="bm-list">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bm-skeleton" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="bm-empty">No bookmarks found</div>
                ) : (
                  filtered.map((bm) => (
                    <button key={bm.id} className="bm-item" onClick={() => handleClick(bm)}>
                      <img
                        src={getFaviconUrl(bm.url)}
                        alt=""
                        className="bm-favicon"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <span className="bm-fallback-icon" style={{ display: 'none' }}>
                        {(bm.title?.[0] || '?').toUpperCase()}
                      </span>
                      <div className="bm-text">
                        <span className="bm-title">{bm.title || 'Untitled'}</span>
                        <span className="bm-url">{bm.url}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const Panel = styled.div`
  width: 340px;
  height: 100%;
  background: rgba(10, 10, 16, 0.88);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border-left: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  color: #fff;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 1rem;
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
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 8px;
    padding: 0.35rem;
    color: rgba(255,255,255,0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.15); color: #fff; }
  }

  .search-box {
    position: relative;
    margin: 1rem 1.25rem 0.5rem;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,0.4);
  }

  .search-input {
    width: 100%;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.55rem 0.75rem 0.55rem 2.25rem;
    color: #fff;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s;

    &::placeholder { color: rgba(255,255,255,0.35); }
    &:focus {
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
    }
  }

  .bm-count {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    padding: 0 1.25rem 0.5rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .bm-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.75rem 1rem;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 999px; }
  }

  .bm-skeleton {
    height: 52px;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    margin-bottom: 4px;
    animation: pulse 1.4s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .bm-empty {
    text-align: center;
    color: rgba(255,255,255,0.3);
    font-size: 0.85rem;
    padding: 2rem;
  }

  .bm-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 10px;
    padding: 0.6rem 0.65rem;
    color: inherit;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: rgba(255,255,255,0.07); }
  }

  .bm-favicon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    flex-shrink: 0;
    object-fit: contain;
  }

  .bm-fallback-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: rgba(255,255,255,0.15);
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
  }

  .bm-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .bm-title {
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(255,255,255,0.9);
  }

  .bm-url {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 1px;
  }
`;
