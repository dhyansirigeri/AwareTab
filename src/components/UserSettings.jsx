import React from 'react';
import { Settings } from 'lucide-react';

export default function UserSettings() {
  return (
    <button className="flex items-center space-x-2 bg-theme-bg/30 hover:bg-theme-bg/50 backdrop-blur-md rounded-full py-2 px-6 shadow-sm border border-theme-border/30 transition-colors group">
      <Settings className="w-4 h-4 text-theme-text/80 group-hover:text-theme-text transition-transform group-hover:rotate-180 duration-500" />
      <span className="text-sm font-medium text-theme-text/90">User settings</span>
    </button>
  );
}
