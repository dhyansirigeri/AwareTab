import React, { useState, useEffect } from 'react';

export default function Clock({ clockFormat = '12h' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const use24h = clockFormat === '24h';

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24h,
  });

  // Split off AM/PM if 12h mode
  const [main, ampm] = use24h
    ? [timeStr, null]
    : timeStr.split(/\s(?=AM|PM)/i).length === 2
      ? timeStr.split(/\s(?=AM|PM)/i)
      : [timeStr, null];

  const dateStr = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-8xl md:text-9xl font-bold tracking-tighter drop-shadow-lg flex items-end gap-3">
        {main}
        {ampm && (
          <span style={{ fontSize: '2.25rem', fontWeight: 600, opacity: 0.65, lineHeight: 1, paddingBottom: '0.6rem', letterSpacing: '0.05em' }}>
            {ampm.toUpperCase()}
          </span>
        )}
      </h1>
      <p className="text-xl mt-2 font-medium opacity-80 uppercase tracking-widest drop-shadow-md">
        {dateStr}
      </p>
    </div>
  );
}
