import React from 'react';
import { Bookmark, LayoutGrid } from 'lucide-react';

export default function TopRightIcons({ onBookmarksClick, onAppsClick, hideBookmarks, hideApps }) {
  if (hideBookmarks && hideApps) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {!hideBookmarks && (
        <button
          onClick={onBookmarksClick}
          title="Bookmarks"
          style={{
            padding: '0.65rem',
            background: 'rgba(var(--theme-bg),0.3)',
            border: '1px solid rgba(var(--theme-border),0.3)',
            borderRadius: '0.75rem',
            color: 'rgb(var(--theme-text))',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(var(--theme-bg),0.5)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(var(--theme-bg),0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Bookmark size={22} />
        </button>
      )}

      {!hideApps && (
        <button
          onClick={onAppsClick}
          title="Most Visited Sites"
          style={{
            padding: '0.65rem',
            background: 'rgba(var(--theme-bg),0.3)',
            border: '1px solid rgba(var(--theme-border),0.3)',
            borderRadius: '0.75rem',
            color: 'rgb(var(--theme-text))',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(var(--theme-bg),0.5)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(var(--theme-bg),0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <LayoutGrid size={22} />
        </button>
      )}
    </div>
  );
}
