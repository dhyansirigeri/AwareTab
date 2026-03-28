import React, { useState, useEffect } from 'react';
import { X, Activity, TrendingUp } from 'lucide-react';
import { getTodayStats, getFaviconUrl } from '../utils/chromeApi';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

export default function UsageStats() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTodayStats().then((s) => {
        setStats(s.slice(0, 10));
        setLoading(false);
      });
    }
  }, [isOpen]);

  const maxCount = stats.length > 0 ? Math.max(...stats.map((s) => s.count)) : 1;
  const totalVisits = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem',
          background: 'rgba(var(--theme-bg),0.3)',
          border: '1px solid rgba(var(--theme-border),0.3)',
          borderRadius: '1rem',
          padding: '0.75rem 1.25rem',
          color: 'rgb(var(--theme-text))',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--theme-bg),0.5)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(var(--theme-bg),0.3)'}
      >
        <Activity size={22} style={{ opacity: 0.8 }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>Usage Stats</span>
        {totalVisits > 0 && (
          <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{totalVisits} visits today</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="us-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="us-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              style={{ position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50 }}
            >
              <Panel>
                <div className="panel-header">
                  <div className="header-title">
                    <TrendingUp size={17} />
                    <span>Today's Usage</span>
                  </div>
                  <button className="close-btn" onClick={() => setIsOpen(false)}>
                    <X size={19} />
                  </button>
                </div>

                {!loading && totalVisits > 0 && (
                  <div className="total-tag">
                    <Activity size={13} />
                    <span>{totalVisits} total visits</span>
                  </div>
                )}

                <div className="chart-container">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="stat-skeleton" />
                    ))
                  ) : stats.length === 0 ? (
                    <div className="empty-state">
                      <Activity size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                      <p>No visits recorded yet today.</p>
                      <p className="empty-sub">Visit some sites and come back!</p>
                    </div>
                  ) : (
                    stats.map((stat, i) => (
                      <motion.div
                        key={stat.domain}
                        className="stat-row"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <img
                          src={getFaviconUrl(`https://${stat.domain}`)}
                          alt=""
                          className="stat-favicon"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <span className="stat-initial" style={{ display: 'none' }}>
                          {stat.domain[0].toUpperCase()}
                        </span>
                        <div className="stat-info">
                          <div className="stat-domain-row">
                            <span className="stat-domain">{stat.domain}</span>
                            <span className="stat-count">{stat.count}×</span>
                          </div>
                          <div className="bar-track">
                            <motion.div
                              className="bar-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${(stat.count / maxCount) * 100}%` }}
                              transition={{ delay: i * 0.05 + 0.15, duration: 0.5, ease: 'easeOut' }}
                              style={{ '--bar-hue': `${(i * 47) % 360}` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </Panel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const Panel = styled.div`
  width: 300px;
  height: 100%;
  background: rgba(8, 8, 14, 0.9);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border-right: 1px solid rgba(255,255,255,0.1);
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

  .total-tag {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0.75rem 1.25rem 0;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .chart-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1.25rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  }

  .stat-skeleton {
    height: 48px;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    color: rgba(255,255,255,0.35);
    font-size: 0.85rem;
    padding: 2rem;
    margin-top: 2rem;

    p { margin: 0.2rem 0; }
    .empty-sub { font-size: 0.75rem; opacity: 0.6; margin-top: 0.25rem; }
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .stat-favicon {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .stat-initial {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    background: rgba(255,255,255,0.12);
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .stat-info {
    flex: 1;
    min-width: 0;
  }

  .stat-domain-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .stat-domain {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255,255,255,0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .stat-count {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    flex-shrink: 0;
    margin-left: 0.25rem;
  }

  .bar-track {
    height: 5px;
    background: rgba(255,255,255,0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 999px;
    background: hsl(calc(var(--bar-hue) * 1deg), 70%, 60%);
    opacity: 0.8;
  }
`;
