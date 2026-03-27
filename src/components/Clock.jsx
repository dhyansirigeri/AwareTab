import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-8xl md:text-9xl font-bold tracking-tighter drop-shadow-lg">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </h1>
      <p className="text-xl mt-2 font-medium opacity-80 uppercase tracking-widest drop-shadow-md">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
}
