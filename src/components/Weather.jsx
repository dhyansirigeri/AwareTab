import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

// ─── Weather code → metadata ──────────────────────────────────────────────────
const getWeatherMeta = (code, isDay = true) => {
  if (code === 0)  return { label: 'Clear Sky',       emoji: isDay ? '☀️' : '🌙', glow: '#f59e0b', accent: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  if (code <= 2)   return { label: 'Partly Cloudy',   emoji: isDay ? '⛅' : '🌤️', glow: '#64748b', accent: '#94a3b8', bg: 'rgba(100,116,139,0.14)' };
  if (code <= 3)   return { label: 'Overcast',        emoji: '☁️',                 glow: '#6b7280', accent: '#9ca3af', bg: 'rgba(107,114,128,0.14)' };
  if (code <= 48)  return { label: 'Foggy',           emoji: '🌫️',                glow: '#94a3b8', accent: '#cbd5e1', bg: 'rgba(148,163,184,0.12)' };
  if (code <= 55)  return { label: 'Drizzle',         emoji: '🌦️',                glow: '#38bdf8', accent: '#7dd3fc', bg: 'rgba(56,189,248,0.12)' };
  if (code <= 67)  return { label: 'Rain',            emoji: '🌧️',                glow: '#3b82f6', accent: '#60a5fa', bg: 'rgba(59,130,246,0.14)' };
  if (code <= 77)  return { label: 'Snow',            emoji: '❄️',                 glow: '#e0f2fe', accent: '#bae6fd', bg: 'rgba(224,242,254,0.14)' };
  if (code <= 82)  return { label: 'Rain Showers',    emoji: '⛈️',                 glow: '#6366f1', accent: '#818cf8', bg: 'rgba(99,102,241,0.14)' };
  if (code <= 86)  return { label: 'Snow Showers',    emoji: '🌨️',                glow: '#bae6fd', accent: '#e0f2fe', bg: 'rgba(186,230,253,0.12)' };
  return           { label: 'Thunderstorm',           emoji: '⛈️',                 glow: '#7c3aed', accent: '#a78bfa', bg: 'rgba(124,58,237,0.16)' };
};

export default function Weather({ onWeatherUpdate }) {
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m&timezone=auto`
        );
        const data = await res.json();
        if (data.current_weather) {
          const cw  = data.current_weather;
          const meta = getWeatherMeta(cw.weathercode, cw.is_day !== 0);
          const condStr = getConditionStr(cw.weathercode);
          setWeather({
            temp: Math.round(cw.temperature),
            windspeed: Math.round(cw.windspeed),
            weathercode: cw.weathercode,
            isDay: cw.is_day !== 0,
            ...meta,
            condStr,
          });
          onWeatherUpdate?.(condStr);
        }
      } catch {
        setWeather({
          temp: '--', windspeed: '--', weathercode: 0,
          label: 'Unavailable', emoji: '🌐',
          glow: '#6b7280', accent: '#9ca3af', bg: 'rgba(107,114,128,0.12)',
          condStr: 'Clear',
        });
      } finally {
        setLoading(false);
      }
    };

    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(
          (p) => fetchWeather(p.coords.latitude, p.coords.longitude),
          () => fetchWeather(51.5074, -0.1278)
        )
      : fetchWeather(51.5074, -0.1278);
  }, []);

  const getConditionStr = (code) => {
    if (code <= 3)  return 'Clear';
    if (code <= 48) return 'Cloudy';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    return 'Storm';
  };

  if (loading) return <LoadingCard />;

  return (
    <Card
      $glow={weather.glow}
      $bg={weather.bg}
      $accent={weather.accent}
      $hovered={hovered}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow orb */}
      <GlowOrb $color={weather.glow} $hovered={hovered} />

      {/* Top row */}
      <TopRow>
        <EmojiWrap $hovered={hovered}>{weather.emoji}</EmojiWrap>
        <TempBlock>
          <Temp>{weather.temp}°</Temp>
          <Unit>C</Unit>
        </TempBlock>
      </TopRow>

      {/* Condition */}
      <Condition $accent={weather.accent}>{weather.label}</Condition>

      {/* Divider */}
      <Divider $color={weather.accent} />

      {/* Wind */}
      <WindRow>
        <WindIcon>💨</WindIcon>
        <WindVal>{weather.windspeed} <span>km/h</span></WindVal>
      </WindRow>
    </Card>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────
const glowPulse = ($color) => keyframes`
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.12); }
`;

const floatEmoji = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-3px) scale(1.08); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ─── Styled components ────────────────────────────────────────────────────────
const Card = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 1rem 1.1rem;
  border-radius: 20px;
  background: ${({ $bg }) => $bg};
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid ${({ $accent }) => $accent}33;
  box-shadow:
    0 4px 24px rgba(0,0,0,0.2),
    0 0 0 1px rgba(255,255,255,0.06) inset,
    ${({ $glow, $hovered }) => $hovered ? `0 0 40px ${$glow}40` : `0 0 20px ${$glow}20`};
  cursor: default;
  transition:
    box-shadow 0.4s ease,
    border-color 0.4s ease,
    transform 0.3s ease;
  transform: ${({ $hovered }) => $hovered ? 'translateY(-3px) scale(1.025)' : 'none'};

  border-color: ${({ $accent, $hovered }) => $hovered ? `${$accent}55` : `${$accent}22`};
`;

const GlowOrb = styled.div`
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  filter: blur(35px);
  top: -20px;
  right: -20px;
  opacity: ${({ $hovered }) => $hovered ? 0.55 : 0.28};
  transition: opacity 0.4s ease;
  pointer-events: none;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.3rem;
`;

const EmojiWrap = styled.span`
  font-size: 1.9rem;
  line-height: 1;
  display: inline-block;
  animation: ${({ $hovered }) => $hovered ? css`${floatEmoji} 1.8s ease-in-out infinite` : 'none'};
  filter: ${({ $hovered }) => $hovered ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.3))' : 'none'};
  transition: filter 0.3s;
`;

const TempBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1px;
`;

const Temp = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 2px 12px rgba(255,255,255,0.2);
`;

const Unit = styled.span`
  font-family: 'Sora', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  color: rgba(255,255,255,0.5);
  margin-top: 0.2rem;
`;

const Condition = styled.p`
  font-family: 'Sora', 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  color: ${({ $accent }) => $accent};
  letter-spacing: 0.03em;
  margin: 0 0 0.6rem;
  opacity: 0.9;
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(to right, transparent, ${({ $color }) => $color}55, transparent);
  margin-bottom: 0.55rem;
`;

const WindRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const WindIcon = styled.span`
  font-size: 0.75rem;
  opacity: 0.7;
`;

const WindVal = styled.span`
  font-family: 'Sora', sans-serif;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.55);
  font-weight: 400;

  span { font-size: 0.65rem; opacity: 0.7; }
`;

const LoadingCard = styled.div`
  width: 100%;
  height: 110px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  animation: ${keyframes`
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  `} 1.6s ease-in-out infinite;
`;