import React, { createContext, useContext, useState, useEffect } from 'react';

const THEMES = [
  {
    name: 'Dark',
    icon: '🌑',
    vars: {
      '--bg':       '#07070f',
      '--bg-card':  '#0f0f1a',
      '--bg-hover': '#141420',
      '--border':   'rgba(255,255,255,0.07)',
      '--border-hi':'rgba(255,255,255,0.14)',
      '--text':     '#eeeeff',
      '--text-2':   '#8887aa',
      '--text-3':   '#44435e',
      '--accent':   '#6366f1',
      '--glow':     '0 0 40px rgba(99,102,241,0.2)',
    }
  },
  {
    name: 'Midnight',
    icon: '🌌',
    vars: {
      '--bg':       '#000510',
      '--bg-card':  '#080d1e',
      '--bg-hover': '#0d1528',
      '--border':   'rgba(6,182,212,0.1)',
      '--border-hi':'rgba(6,182,212,0.2)',
      '--text':     '#e0f2fe',
      '--text-2':   '#7dd3fc',
      '--text-3':   '#1e40af',
      '--accent':   '#06b6d4',
      '--glow':     '0 0 40px rgba(6,182,212,0.2)',
    }
  },
  {
    name: 'Sunset',
    icon: '🌅',
    vars: {
      '--bg':       '#0f070a',
      '--bg-card':  '#1a0a10',
      '--bg-hover': '#220d15',
      '--border':   'rgba(236,72,153,0.1)',
      '--border-hi':'rgba(236,72,153,0.2)',
      '--text':     '#fdf2f8',
      '--text-2':   '#f9a8d4',
      '--text-3':   '#831843',
      '--accent':   '#ec4899',
      '--glow':     '0 0 40px rgba(236,72,153,0.2)',
    }
  },
  {
    name: 'Forest',
    icon: '🌿',
    vars: {
      '--bg':       '#050f09',
      '--bg-card':  '#0a1a10',
      '--bg-hover': '#0f2218',
      '--border':   'rgba(16,185,129,0.1)',
      '--border-hi':'rgba(16,185,129,0.2)',
      '--text':     '#ecfdf5',
      '--text-2':   '#6ee7b7',
      '--text-3':   '#065f46',
      '--accent':   '#10b981',
      '--glow':     '0 0 40px rgba(16,185,129,0.2)',
    }
  },
  {
    name: 'Light',
    icon: '☀️',
    vars: {
      '--bg':       '#f5f5ff',
      '--bg-card':  '#ffffff',
      '--bg-hover': '#f0f0fc',
      '--border':   'rgba(99,102,241,0.12)',
      '--border-hi':'rgba(99,102,241,0.25)',
      '--text':     '#1a1a2e',
      '--text-2':   '#4a4a6a',
      '--text-3':   '#9a9ab0',
      '--accent':   '#6366f1',
      '--glow':     '0 0 40px rgba(99,102,241,0.1)',
    }
  },
];

const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [idx, setIdx] = useState(() => parseInt(localStorage.getItem('tf-theme') || '0'));

  useEffect(() => {
    const theme = THEMES[idx];
    const root  = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('tf-theme', idx);
  }, [idx]);

  const cycle = () => setIdx(i => (i + 1) % THEMES.length);

  return (
    <ThemeContext.Provider value={{ theme: THEMES[idx], cycle, idx, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
