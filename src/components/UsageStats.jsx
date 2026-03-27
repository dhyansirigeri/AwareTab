import React from 'react';
import { Activity } from 'lucide-react';

export default function UsageStats() {
  return (
    <button className="flex flex-col items-center justify-center bg-theme-bg/30 hover:bg-theme-bg/50 backdrop-blur-md rounded-2xl p-4 px-6 shadow-sm border border-theme-border/30 transition-colors group">
      <Activity className="w-6 h-6 mb-2 text-theme-text/80 group-hover:text-theme-text" />
      <span className="text-sm font-semibold text-theme-text/90">Usage Stats</span>
    </button>
  );
}
