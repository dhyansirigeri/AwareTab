import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

export default function Clock({ clockFormat = '12h' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const use24h = clockFormat === '24h';

  const hours = use24h
    ? String(time.getHours()).padStart(2, '0')
    : String(time.getHours() % 12 || 12).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const ampm = use24h ? null : time.getHours() >= 12 ? 'PM' : 'AM';

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ClockWrapper>
      <TimeRow>
        <TimeDigits>
          <span className="time-main">{hours}</span>
          <span className="colon">:</span>
          <span className="time-main">{minutes}</span>
        </TimeDigits>
        {ampm && <AmPm>{ampm}</AmPm>}
      </TimeRow>
      <DateStr>{dateStr}</DateStr>
    </ClockWrapper>
  );
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const ClockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  user-select: none;
`;

const TimeRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  line-height: 1;
`;

const TimeDigits = styled.div`
  display: flex;
  align-items: center;
  font-family: 'Space Grotesk', 'Inter', sans-serif;
  font-weight: 700;
  font-size: clamp(5rem, 12vw, 9rem);
  letter-spacing: -0.04em;
  color: #ffffff;
  text-shadow:
    0 2px 40px rgba(255, 255, 255, 0.15),
    0 0 80px rgba(255, 255, 255, 0.05);
  line-height: 1;

  .time-main {
    display: inline-block;
  }

  .colon {
    display: inline-block;
    margin: 0 0.05em;
    animation: ${pulse} 1.4s ease-in-out infinite;
    opacity: 0.75;
    position: relative;
    top: -0.08em;
  }
`;

const AmPm = styled.span`
  font-family: 'Sora', 'Inter', sans-serif;
  font-weight: 300;
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.55);
  padding-bottom: 0.9rem;
  text-transform: uppercase;
`;

const DateStr = styled.p`
  font-family: 'Sora', 'Inter', sans-serif;
  font-weight: 300;
  font-size: clamp(0.8rem, 1.4vw, 1rem);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
  margin: 0;
`;
