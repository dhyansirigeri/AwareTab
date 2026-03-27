import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake } from 'lucide-react';

export default function Weather({ onWeatherUpdate }) {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading' });
  const [icon, setIcon] = useState(<Cloud className="w-6 h-6" />);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          const conditionStr = getWeatherDesc(data.current_weather.weathercode);
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            condition: conditionStr
          });
          setIcon(getWeatherIcon(data.current_weather.weathercode));
          if (onWeatherUpdate) onWeatherUpdate(conditionStr);
        }
      } catch (err) {
        setWeather({ temp: '--', condition: 'Unavailable' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(51.5074, -0.1278) // fallback to London
      );
    } else {
      fetchWeather(51.5074, -0.1278);
    }
  }, []);

  const getWeatherDesc = (code) => {
    if (code <= 3) return "Clear";
    if (code <= 48) return "Cloudy";
    if (code <= 77) return "Rain";
    return "Snow";
  };

  const getWeatherIcon = (code) => {
    if (code <= 3) return <Sun className="w-6 h-6" />;
    if (code <= 48) return <Cloud className="w-6 h-6" />;
    if (code <= 77) return <CloudRain className="w-6 h-6" />;
    return <Snowflake className="w-6 h-6" />;
  };

  return (
    <div className="flex items-center space-x-3 bg-theme-bg/30 backdrop-blur-md rounded-2xl p-3 px-4 shadow-sm border border-theme-border/30 text-theme-text">
      {icon}
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{weather.temp}°C</span>
        <span className="text-xs opacity-75">{weather.condition}</span>
      </div>
    </div>
  );
}
