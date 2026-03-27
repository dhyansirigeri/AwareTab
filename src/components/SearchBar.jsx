import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="relative w-full max-w-lg mb-8">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-theme-text/50" />
      </div>
      <input
        type="text"
        placeholder="Search the web..."
        className="w-full bg-theme-bg/30 backdrop-blur-md border border-theme-border/30 rounded-full py-4 pl-12 pr-6 text-theme-text placeholder-theme-text/50 outline-none focus:bg-theme-bg/50 focus:border-theme-border/50 transition-all shadow-lg"
      />
    </div>
  );
}
