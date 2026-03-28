import React, { useState, useEffect } from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { getTopSites, getFaviconUrl, openUrl } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

export default function AppsGrid({ isOpen, onClose }) {
  const [sites, setSites]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTopSites().then((s) => {
        setSites(s.slice(0, 12));
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleClick = (url) => {
    openUrl(url, false);
    onClose();
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getShortName = (title, url) => {
    if (title && title.length > 0) return title;
    return getDomain(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="apps-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
          />

          <motion.div
            key="apps-modal"
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 240 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
            }}
          >
            <Modal>
              <div className="modal-header">
                <div className="header-title">
                  <LayoutGrid size={17} />
                  <span>Most Visited</span>
                </div>
                <button className="close-btn" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>

              <div className="apps-grid">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="app-skeleton" />
                  ))
                  : sites.map((site, i) => (
                    <button
                      key={i}
                      className="app-tile"
                      onClick={() => handleClick(site.url)}
                      title={site.url}
                    >
                      <div className="app-icon-wrap">
                        <img
                          src={getFaviconUrl(site.url)}
                          alt=""
                          className="app-favicon"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <span className="app-fallback" style={{ display: 'none' }}>
                          {(getShortName(site.title, site.url)?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <span className="app-name">
                        {getShortName(site.title, site.url).split(' ')[0]}
                      </span>
                    </button>
                  ))
                }
              </div>
            </Modal>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const Modal = styled.div`
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 1.25rem;
  width: 380px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.5);
  color: #fff;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    opacity: 0.85;
  }

  .close-btn {
    background: rgba(255,255,255,0.08);
    border: none;
    border-radius: 7px;
    padding: 0.3rem;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s;
    &:hover { background: rgba(255,255,255,0.15); color: #fff; }
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .app-skeleton {
    height: 80px;
    background: rgba(255,255,255,0.07);
    border-radius: 14px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .app-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    padding: 0.85rem 0.5rem;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, border-color 0.2s;
    color: inherit;

    &:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    &:active { transform: translateY(0) scale(0.96); }
  }

  .app-icon-wrap {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .app-favicon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .app-fallback {
    width: 100%;
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
    color: rgba(255,255,255,0.7);
  }

  .app-name {
    font-size: 0.7rem;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 72px;
  }
`;
