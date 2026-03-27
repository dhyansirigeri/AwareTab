export const MOODS = {
  FRUSTRATED: 'FRUSTRATED',
  FOCUSED: 'FOCUSED',
  TIRED: 'TIRED',
  RELAXED: 'RELAXED'
};

export const THEMES = {
  [MOODS.FRUSTRATED]: {
    colors: ['#FFF3E0', '#FF8F00'],
    textColor: 'text-amber-900',
    clutter: 'minimal',
    greeting: "Take a deep breath. You've got this.",
    soundType: 'lofi'
  },
  [MOODS.FOCUSED]: {
    colors: ['#0f172a', '#312e81'],
    textColor: 'text-indigo-50',
    clutter: 'none',
    greeting: "Deep work mode. Stay focused.",
    soundType: 'brownNoise'
  },
  [MOODS.TIRED]: {
    colors: ['#FEF3C7', '#D97706'],
    textColor: 'text-amber-900',
    clutter: 'reduced',
    greeting: "It's been a long day. Time to wind down soon?",
    soundType: 'ambient'
  },
  [MOODS.RELAXED]: {
    colors: ['#ECFDF5', '#059669'],
    textColor: 'text-emerald-900',
    clutter: 'normal',
    greeting: "Welcome back. Perfect day for browsing.",
    soundType: 'lightMusic'
  }
};
