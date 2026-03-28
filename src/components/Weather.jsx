import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';

export default function Weather({ onWeatherUpdate }) {
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading', windspeed: '--' });

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          const conditionStr = getWeatherDesc(data.current_weather.weathercode);
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            condition: conditionStr,
            windspeed: data.current_weather.windspeed
          });
          if (onWeatherUpdate) onWeatherUpdate(conditionStr);
        }
      } catch (err) {
        setWeather({ temp: '--', condition: 'Unavailable', windspeed: '--' });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(51.5074, -0.1278)
      );
    } else {
      fetchWeather(51.5074, -0.1278);
    }
  }, [onWeatherUpdate]);

  const getWeatherDesc = (code) => {
    if (code <= 3) return "Clear";
    if (code <= 48) return "Cloudy";
    if (code <= 77) return "Rain";
    return "Snow";
  };

  const getWeatherIcon = () => {
    if (weather.condition === 'Clear') return <Sun className="w-5 h-5" />;
    if (weather.condition === 'Rain') return <CloudRain className="w-5 h-5" />;
    return <Cloud className="w-5 h-5" />;
  };

  return (
    <div className="bg-theme-bg/20 backdrop-blur-xl rounded-2xl p-4 border border-theme-border/20 transition-all duration-300 hover:bg-theme-bg/30 hover:scale-105">
      <div className="flex items-center space-x-4">
        <div className="text-theme-text/80">
          {getWeatherIcon()}
        </div>
        <div className="flex flex-col">
          <div className="text-2xl font-semibold text-theme-text font-display">
            {weather.temp}°C
          </div>
          <div className="text-sm font-light text-theme-text/70 font-body">
            {weather.condition}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-theme-border/20">
        <div className="flex items-center space-x-2 text-xs text-theme-text/60 font-body">
          <Wind className="w-3 h-3" />
          <span>{weather.windspeed} km/h</span>
        </div>
      </div>
    </div>
  );
}