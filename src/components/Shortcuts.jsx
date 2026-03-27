import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export default function Shortcuts({ clutterLevel }) {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.topSites) {
      chrome.topSites.get((topSites) => {
        setSites(topSites.slice(0, 8)); // Get top 8 sites
      });
    } else {
      // Dummy data for local Development outside extension
      setSites([
        { title: 'GitHub', url: 'https://github.com' },
        { title: 'YouTube', url: 'https://youtube.com' },
        { title: 'Twitter', url: 'https://twitter.com' },
        { title: 'Reddit', url: 'https://reddit.com' }
      ]);
    }
  }, []);

  if (clutterLevel === 'none') {
    return null;
  }

  const displayCount = clutterLevel === 'reduced' ? 4 : 8;
  const visibleSites = sites.slice(0, displayCount);

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium opacity-60 uppercase tracking-wider mb-4 border-b border-theme-border/30 pb-2 text-theme-text">
        Top Sites
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleSites.map((site) => {
          let hostname = "globe";
          try {
            hostname = new URL(site.url).hostname;
          } catch (e) {}

          return (
            <a
              key={site.url}
              href={site.url}
              className="group flex flex-col items-center justify-center p-4 bg-theme-bg/20 hover:bg-theme-bg/40 backdrop-blur-md rounded-xl border border-theme-border/20 hover:border-theme-border/40 transition-all shadow-sm text-theme-text"
            >
              <div className="w-10 h-10 mb-2 rounded-full flex flex-shrink-0 overflow-hidden items-center justify-center bg-theme-bg/30 group-hover:bg-theme-bg/50 transition-colors">
                <img 
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${hostname}`} 
                  alt="" 
                  className="w-6 h-6 object-contain" 
                  onError={(e) => {e.target.style.display='none'}} 
                />
              </div>
              <span className="text-sm font-medium truncate w-full text-center opacity-90 group-hover:opacity-100">
                {site.title}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
