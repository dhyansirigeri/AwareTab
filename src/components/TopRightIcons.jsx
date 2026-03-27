import React from 'react';
import { Bookmark, LayoutGrid } from 'lucide-react';

export default function TopRightIcons() {
  return (
    <div className="flex items-center space-x-4">
      <button className="p-3 bg-theme-bg/30 hover:bg-theme-bg/50 backdrop-blur-md rounded-xl border border-theme-border/30 transition-colors text-theme-text" title="Bookmarks">
        <Bookmark className="w-6 h-6" />
      </button>
      <button className="p-3 bg-theme-bg/30 hover:bg-theme-bg/50 backdrop-blur-md rounded-xl border border-theme-border/30 transition-colors text-theme-text" title="Chrome Apps">
        <LayoutGrid className="w-6 h-6" />
      </button>
    </div>
  );
}
