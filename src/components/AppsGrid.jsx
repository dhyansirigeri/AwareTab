import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { openUrl } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

// ─── Hardcoded Google apps with real favicons ─────────────────────────────────
const GOOGLE_APPS = [
  { name: 'Search',    url: 'https://www.google.com',           favicon: 'https://www.google.com/favicon.ico' },
  { name: 'Gmail',     url: 'https://mail.google.com',          favicon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
  { name: 'Drive',     url: 'https://drive.google.com',         favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png' },
  { name: 'YouTube',   url: 'https://www.youtube.com',          favicon: 'https://www.youtube.com/favicon.ico' },
  { name: 'Maps',      url: 'https://maps.google.com',          favicon: 'https://maps.gstatic.com/mapfiles/maps_lite/favicon_hdpi.ico' },
  { name: 'Meet',      url: 'https://meet.google.com',          favicon: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-512dp/logo_meet_2020q4_color_2x_web_512dp.png' },
  { name: 'Calendar',  url: 'https://calendar.google.com',      favicon: 'https://calendar.google.com/googlecalendar/images/favicon_v2014_2.ico' },
  { name: 'Translate', url: 'https://translate.google.com',     favicon: 'https://ssl.gstatic.com/translate/favicon.ico' },
  { name: 'Photos',    url: 'https://photos.google.com',        favicon: 'https://www.gstatic.com/images/icons/material/product/1x/photos_48dp.png' },
  { name: 'Docs',      url: 'https://docs.google.com',          favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
  { name: 'Sheets',    url: 'https://sheets.google.com',        favicon: 'https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico' },
  { name: 'News',      url: 'https://news.google.com',          favicon: 'https://lh3.googleusercontent.com/DR43tDQH6_ORjxcMCgMx5-UjMwBr3pN8iCHPFGMD5BSEzfLd6-hT7i2E5nJkb0LW=s180' },
  { name: 'Chat',      url: 'https://chat.google.com',          favicon: 'https://www.gstatic.com/images/icons/material/product/2x/chat_48dp.png' },
  { name: 'Gemini',    url: 'https://gemini.google.com',        favicon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg' },
  { name: 'Play',      url: 'https://play.google.com',          favicon: 'https://www.gstatic.com/android/market_images/web/favicon_v2.ico' },
  { name: 'Slides',    url: 'https://slides.google.com',        favicon: 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico' },
  { name: 'Keep',      url: 'https://keep.google.com',          favicon: 'https://ssl.gstatic.com/keep/favicon_2020q4v2.ico' },
  { name: 'Forms',     url: 'https://forms.google.com',         favicon: 'https://ssl.gstatic.com/docs/forms/device_home/android_192.png' },
];

export default function GoogleAppsPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleClick = (url) => {
    openUrl(url, false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="google-apps-panel"
          initial={{ opacity: 0, scale: 0.9, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          style={{
            position: 'fixed',
            top: '4.5rem',
            right: '2rem',
            zIndex: 60,
            transformOrigin: 'top right',
          }}
        >
          <Panel>
            <div className="panel-header">
              <span className="panel-title">Google Apps</span>
              <button className="close-btn" onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            <div className="apps-grid">
              {GOOGLE_APPS.map((app) => (
                <button
                  key={app.name}
                  className="app-tile"
                  onClick={() => handleClick(app.url)}
                  title={app.url}
                >
                  <div className="app-icon-wrap">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(app.url).hostname}&sz=64`}
                      alt={app.name}
                      className="app-favicon"
                      onError={(e) => {
                        e.target.src = app.favicon;
                        e.target.onerror = () => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        };
                      }}
                    />
                    <span className="app-fallback" style={{ display: 'none' }}>
                      {app.name[0]}
                    </span>
                  </div>
                  <span className="app-name">{app.name}</span>
                </button>
              ))}
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Panel = styled.div`
  width: 260px;
  background: rgba(12, 12, 18, 0.92);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 0.875rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.04);
  color: #fff;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.25rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    margin-bottom: 0.75rem;
  }

  .panel-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.07);
    border: none;
    border-radius: 6px;
    padding: 0.25rem;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
    }
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
    max-height: 420px;
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  }

  .app-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 14px;
    padding: 0.75rem 0.4rem;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, transform 0.15s;
    color: inherit;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    &:active {
      transform: scale(0.94);
    }
  }

  .app-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .app-favicon {
    width: 30px;
    height: 30px;
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
    color: rgba(255, 255, 255, 0.65);
  }

  .app-name {
    font-size: 0.7rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.65);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 68px;
  }
`;
