/**
 * chromeApi.js
 * Safe wrappers for Chrome Extension APIs with fallback mock data for dev mode.
 * All functions return Promises.
 */

const IS_EXTENSION = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

// ─── Storage ────────────────────────────────────────────────────────────────

const _mockStorage = {};

export const storageGet = (keys) => {
  if (IS_EXTENSION) {
    return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
  }
  const result = {};
  const keyList = Array.isArray(keys) ? keys : (keys ? [keys] : null);
  if (!keyList) {
    return Promise.resolve({ ..._mockStorage });
  }
  keyList.forEach((k) => {
    if (_mockStorage[k] !== undefined) result[k] = _mockStorage[k];
  });
  return Promise.resolve(result);
};

export const storageSet = (data) => {
  if (IS_EXTENSION) {
    return new Promise((resolve) => chrome.storage.sync.set(data, resolve));
  }
  Object.assign(_mockStorage, data);
  return Promise.resolve();
};

export const localStorageGet = (keys) => {
  if (IS_EXTENSION) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }
  try {
    const result = {};
    const keyList = Array.isArray(keys) ? keys : (keys ? [keys] : null);
    if (!keyList) {
      const all = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        try { all[k] = JSON.parse(localStorage.getItem(k)); } catch { all[k] = localStorage.getItem(k); }
      }
      return Promise.resolve(all);
    }
    keyList.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw !== null) { try { result[k] = JSON.parse(raw); } catch { result[k] = raw; } }
    });
    return Promise.resolve(result);
  } catch {
    return Promise.resolve({});
  }
};

export const localStorageSet = (data) => {
  if (IS_EXTENSION) {
    return new Promise((resolve) => chrome.storage.local.set(data, resolve));
  }
  try {
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  } catch {}
  return Promise.resolve();
};

// ─── Bookmarks ───────────────────────────────────────────────────────────────

const MOCK_BOOKMARKS = [
  { id: '1', title: 'Google', url: 'https://www.google.com', dateAdded: Date.now() },
  { id: '2', title: 'GitHub', url: 'https://github.com', dateAdded: Date.now() },
  { id: '3', title: 'YouTube', url: 'https://www.youtube.com', dateAdded: Date.now() },
  { id: '4', title: 'Reddit', url: 'https://www.reddit.com', dateAdded: Date.now() },
  { id: '5', title: 'Stack Overflow', url: 'https://stackoverflow.com', dateAdded: Date.now() },
  { id: '6', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', dateAdded: Date.now() },
  { id: '7', title: 'Twitter / X', url: 'https://twitter.com', dateAdded: Date.now() },
  { id: '8', title: 'Hacker News', url: 'https://news.ycombinator.com', dateAdded: Date.now() },
  { id: '9', title: 'Wikipedia', url: 'https://www.wikipedia.org', dateAdded: Date.now() },
  { id: '10', title: 'Figma', url: 'https://www.figma.com', dateAdded: Date.now() },
];

/** Recursively flatten ChromeBookmarkTreeNode[] into a flat array of { id, title, url } */
const flattenBookmarks = (nodes) => {
  const result = [];
  const walk = (node) => {
    if (node.url) {
      result.push({ id: node.id, title: node.title || node.url, url: node.url, dateAdded: node.dateAdded || 0 });
    }
    if (node.children) node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return result;
};

export const getBookmarks = () => {
  if (IS_EXTENSION) {
    return new Promise((resolve) =>
      chrome.bookmarks.getTree((tree) => resolve(flattenBookmarks(tree)))
    );
  }
  return Promise.resolve(MOCK_BOOKMARKS);
};

// ─── Top Sites ───────────────────────────────────────────────────────────────

const MOCK_TOP_SITES = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Reddit', url: 'https://www.reddit.com' },
  { title: 'Twitter', url: 'https://twitter.com' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
  { title: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { title: 'LinkedIn', url: 'https://www.linkedin.com' },
];

export const getTopSites = () => {
  if (IS_EXTENSION) {
    return new Promise((resolve) => chrome.topSites.get(resolve));
  }
  return Promise.resolve(MOCK_TOP_SITES);
};

// ─── Favicon ─────────────────────────────────────────────────────────────────

export const getFaviconUrl = (url) => {
  try {
    const origin = new URL(url).origin;
    if (IS_EXTENSION) {
      // Chrome 119+ supports chrome-extension favicon URL
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
    }
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return null;
  }
};

// ─── Usage Tracking ──────────────────────────────────────────────────────────

export const getTodayKey = () => {
  const d = new Date();
  return `usage-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const recordVisit = async () => {
  const key = getTodayKey();
  const data = await localStorageGet([key]);
  const existing = data[key] || {};
  // We don't track individual domains here — that's done lazily in UsageStats
  return existing;
};

export const recordDomainVisit = async (url) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const key = getTodayKey();
    const data = await localStorageGet([key]);
    const existing = data[key] || {};
    existing[domain] = (existing[domain] || 0) + 1;
    await localStorageSet({ [key]: existing });
  } catch {}
};

export const getTodayStats = async () => {
  const key = getTodayKey();
  const data = await localStorageGet([key]);
  const stats = data[key] || {};
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([domain, count]) => ({ domain, count }));
};

// ─── Open URL ────────────────────────────────────────────────────────────────

export const openUrl = (url, newTab = false) => {
  if (IS_EXTENSION && newTab) {
    chrome.tabs.create({ url });
  } else {
    window.location.href = url;
  }
};
