import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { getTodayStats } from '../utils/chromeApi';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

// ─── Category detection ────────────────────────────────────────────────────────
const KEYWORDS = {
  work:          ['github', 'gitlab', 'notion', 'linear', 'jira', 'slack', 'figma', 'drive', 'docs', 'sheets', 'asana', 'trello', 'clickup', 'zoom', 'meet', 'calendar', 'gmail', 'outlook', 'stackoverflow', 'leetcode'],
  social:        ['twitter', 'instagram', 'facebook', 'reddit', 'tiktok', 'linkedin', 'discord', 'telegram', 'whatsapp', 'x.com'],
  entertainment: ['youtube', 'netflix', 'spotify', 'twitch', 'primevideo', 'hotstar', 'disneyplus'],
  news:          ['news', 'cnn', 'bbc', 'techcrunch', 'verge', 'medium', 'substack'],
};

const CAT_META = {
  work:          { label: 'WORK',          color: '#4ade80', track: 'rgba(74,222,128,0.14)' },
  social:        { label: 'SOCIAL',        color: '#f59e0b', track: 'rgba(245,158,11,0.14)' },
  entertainment: { label: 'ENTERTAIN',     color: '#f472b6', track: 'rgba(244,114,182,0.14)' },
  news:          { label: 'NEWS',          color: '#60a5fa', track: 'rgba(96,165,250,0.14)' },
  other:         { label: 'OTHER',         color: '#a78bfa', track: 'rgba(167,139,250,0.14)' },
};

function categorise(domain) {
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    if (kws.some((k) => domain.includes(k))) return cat;
  }
  return 'other';
}

function toTimeStr(visits) {
  const mins = visits * 4;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UsageStats() {
  const [totalVisits, setTotal]   = useState(0);
  const [catStats, setCatStats]   = useState([]);
  const [hovered, setHovered]     = useState(false);
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    getTodayStats().then((s) => {
      const total = s.reduce((sum, x) => sum + x.count, 0);
      setTotal(total);

      const catMap = {};
      for (const { domain, count } of s) {
        const cat = categorise(domain);
        catMap[cat] = (catMap[cat] || 0) + count;
      }

      const maxCat = Math.max(1, ...Object.values(catMap));
      const cats = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => ({
          cat,
          count,
          pct: Math.round((count / Math.max(1, total)) * 100),
          bar: Math.round((count / maxCat) * 100),
          ...CAT_META[cat],
        }));

      setCatStats(cats);
      setLoaded(true);
    });
  }, []);

  const timeStr = toTimeStr(totalVisits);
  // rough +% above avg (mock heuristic)
  const avgAbove = totalVisits > 2 ? Math.round((totalVisits * 0.12)) : 0;

  return (
    <Card
      $hovered={hovered}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ambient glow */}
      <GlowBlob $hovered={hovered} />

      {/* Header */}
      <Header>
        <HeaderLeft>
          <TrendingUp size={13} style={{ opacity: 0.7 }} />
          <HeaderTitle>Usage Stats</HeaderTitle>
        </HeaderLeft>
        <TodayBadge>Today</TodayBadge>
      </Header>

      {/* Big time */}
      <BigTime>
        <motion.span
          className="time-val"
          key={timeStr}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {loaded ? timeStr : '—'}
        </motion.span>
        {avgAbove > 0 && (
          <motion.span
            className="avg-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            +{avgAbove}% from avg
          </motion.span>
        )}
      </BigTime>

      {/* Category bars */}
      <Bars>
        {catStats.length === 0 && loaded && (
          <EmptyNote>Browse some sites to see stats!</EmptyNote>
        )}
        {catStats.map((c, i) => (
          <Bar key={c.cat}>
            <BarHeader>
              <span className="bar-label">{c.label}</span>
              <span className="bar-pct">{c.pct}%</span>
            </BarHeader>
            <BarTrack style={{ background: c.track }}>
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: hovered
                    ? `linear-gradient(90deg, ${c.color}cc, ${c.color})`
                    : c.color,
                  boxShadow: hovered ? `0 0 8px ${c.color}80` : 'none',
                  transition: 'background 0.4s, box-shadow 0.4s',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${c.bar}%` }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
              />
            </BarTrack>
          </Bar>
        ))}
      </Bars>
    </Card>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────
const glowBreath = keyframes`
  0%, 100% { opacity: 0.18; transform: scale(1); }
  50% { opacity: 0.28; transform: scale(1.08); }
`;

// ─── Styled components ────────────────────────────────────────────────────────
const Card = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 1rem 1.1rem 1.1rem;
  border-radius: 20px;
  background: ${({ $hovered }) =>
    $hovered
      ? 'rgba(22, 36, 28, 0.92)'
      : 'rgba(16, 26, 20, 0.88)'};
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid ${({ $hovered }) =>
    $hovered ? 'rgba(74,222,128,0.22)' : 'rgba(255,255,255,0.08)'};
  box-shadow: ${({ $hovered }) =>
    $hovered
      ? '0 8px 40px rgba(0,0,0,0.35), 0 0 30px rgba(74,222,128,0.1)'
      : '0 4px 20px rgba(0,0,0,0.25)'};
  transform: ${({ $hovered }) => $hovered ? 'translateY(-3px)' : 'none'};
  transition:
    background 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    transform 0.3s ease;
  cursor: default;
`;

const GlowBlob = styled.div`
  position: absolute;
  bottom: -30px;
  left: -20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #4ade80 0%, transparent 70%);
  filter: blur(30px);
  animation: ${glowBreath} 3.5s ease-in-out infinite;
  pointer-events: none;
  opacity: ${({ $hovered }) => $hovered ? 0.35 : 0.18};
  transition: opacity 0.4s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgba(255,255,255,0.55);
`;

const HeaderTitle = styled.span`
  font-family: 'Sora', 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  letter-spacing: 0.01em;
`;

const TodayBadge = styled.span`
  font-family: 'Sora', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  letter-spacing: 0.04em;
`;

const BigTime = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
  flex-wrap: wrap;

  .time-val {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.1rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .avg-badge {
    font-family: 'Sora', sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    color: #4ade80;
    background: rgba(74,222,128,0.1);
    border: 1px solid rgba(74,222,128,0.22);
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
  }
`;

const Bars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Bar = styled.div``;

const BarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.28rem;

  .bar-label {
    font-family: 'Sora', sans-serif;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.35);
  }

  .bar-pct {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.65rem;
    font-weight: 500;
    color: rgba(255,255,255,0.3);
  }
`;

const BarTrack = styled.div`
  height: 5px;
  border-radius: 999px;
  overflow: hidden;
`;

const EmptyNote = styled.p`
  font-family: 'Sora', sans-serif;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.25);
  margin: 0;
`;
