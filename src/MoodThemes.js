export const MOODS = {
  STRESSED: 'STRESSED',
  FOCUSED: 'FOCUSED',
  TIRED: 'TIRED',
  RELAXED: 'RELAXED'
};

/**
 * THEMES defines per-mood:
 *  - colors: CSS gradient stops [from, to]
 *  - textColor: Tailwind class
 *  - clutter: shortcut density 'none' | 'minimal' | 'reduced' | 'normal'
 *  - greeting: welcome message
 *  - soundType: ambient audio key
 *  - components: { show: string[] }  — which components are visible
 *
 * Component keys: 'clock', 'weather', 'music', 'shortcuts', 'usageStats',
 *                 'searchBar', 'breathingGuide', 'focusTimer', 'bookmarks', 'googleApps'
 */
export const THEMES = {
  [MOODS.STRESSED]: {
    colors: ['#1a0a00', '#7c2d00'],
    gradientAngle: 135,
    textColor: 'text-orange-100',
    accentColor: '#ff6b35',
    clutter: 'minimal',
    greeting: "Take a deep breath. You've got this. 🌬️",
    soundType: 'lofi',
    components: {
      show: ['clock', 'weather', 'music', 'breathingGuide'],
      hide: ['shortcuts', 'usageStats', 'focusTimer'],
    },
    moodLabel: 'Stressed',
    moodEmoji: '😤',
    moodHint: 'Detected high activity — showing calming tools'
  },

  [MOODS.FOCUSED]: {
    colors: ['#050816', '#1e1b4b'],
    gradientAngle: 160,
    textColor: 'text-indigo-50',
    accentColor: '#818cf8',
    clutter: 'none',
    greeting: 'Deep work mode. Stay in the zone. 🎯',
    soundType: 'brownNoise',
    components: {
      show: ['clock', 'music', 'focusTimer', 'shortcuts', 'searchBar'],
      hide: ['weather', 'usageStats', 'breathingGuide', 'bookmarks', 'googleApps'],
    },
    moodLabel: 'Focused',
    moodEmoji: '🎯',
    moodHint: 'Minimal distractions — focus mode active'
  },

  [MOODS.TIRED]: {
    colors: ['#1c0f00', '#78350f'],
    gradientAngle: 120,
    textColor: 'text-amber-100',
    accentColor: '#f59e0b',
    clutter: 'reduced',
    greeting: "It's been a long day. Wind down soon? 🌙",
    soundType: 'ambient',
    components: {
      show: ['clock', 'weather', 'music', 'usageStats', 'shortcuts'],
      hide: ['breathingGuide', 'focusTimer'],
    },
    moodLabel: 'Tired',
    moodEmoji: '😴',
    moodHint: 'Low activity detected — showing essentials'
  },

  [MOODS.RELAXED]: {
    colors: ['#022c22', '#064e3b'],
    gradientAngle: 135,
    textColor: 'text-emerald-50',
    accentColor: '#34d399',
    clutter: 'normal',
    greeting: 'Welcome back. Perfect moment to explore. 🌿',
    soundType: 'lightMusic',
    components: {
      show: ['clock', 'weather', 'music', 'shortcuts', 'usageStats', 'searchBar', 'bookmarks', 'googleApps'],
      hide: ['breathingGuide', 'focusTimer'],
    },
    moodLabel: 'Relaxed',
    moodEmoji: '😌',
    moodHint: 'Normal browsing mode'
  }
};
