import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTheme, setTheme as saveThemeToDB } from './dbHelpers';

const ThemeContext = createContext();

// ============================================================
//  CHANGE THE LOOK WITH ONE LETTER:  'A', 'B' or 'C'
//    A = Refined indigo (closest to your current colors)
//    B = Paper and ink  (warm cream + deep indigo + coral highlight)
//    C = Mint and indigo
// ============================================================
export const ACTIVE_PALETTE = 'A';

// Keys every screen can rely on. `bt` is the filled-button color (white text
// on it always has good contrast), `accent` is for text, icons and rings.
const BASE = {
  light: {
    background: '#F5F3FF', card: '#FFFFFF', text: '#1E1B4B', subText: '#6B6A8F',
    accent: '#6C5CE7', accentLight: '#A29BFE', accentDark: '#4834D4',
    button: '#6C5CE7', buttonHover: '#8577F0', link: '#5B4BDB',
    border: '#E4DFFF', input: '#EEEBFF', secondary: '#EEEBFF',
    error: '#E24B4A', success: '#2E9E5B', warning: '#BA7517', buttonText: '#FFFFFF',
    gradientStart: '#8B7CFF', gradientEnd: '#5B4BDB',
    section1: '#EEEBFF', section2: '#E2DDFF', section3: '#D2CBFF', section4: '#BFB5FF',
    bt: '#6C5CE7', bt2: '#4834D4', hl: '#FF9F7A', warn: '#FFF1EA',
  },
  dark: {
    background: '#14112B', card: '#201C40', text: '#F4F2FF', subText: '#A9A5D6',
    accent: '#A89CFF', accentLight: '#B1A7FF', accentDark: '#5B4BDB',
    button: '#6C5CE7', buttonHover: '#9A8DFF', link: '#B1A7FF',
    border: '#332E5E', input: '#1A1736', secondary: '#2A2552',
    error: '#FF7A93', success: '#4ADE80', warning: '#FFC857', buttonText: '#FFFFFF',
    gradientStart: '#8B7CFF', gradientEnd: '#5B4BDB',
    section1: '#2A2552', section2: '#342E66', section3: '#443C80', section4: '#5B4FA0',
    bt: '#5B4BDB', bt2: '#4834D4', hl: '#FF9F7A', warn: '#3A2430',
  },
};

const PALETTES = {
  A: {
    light: { background: '#ECE9FB', text: '#1E1B4B', subText: '#5E5C85', accent: '#5B4BDB', button: '#5B4BDB', border: '#D3CEF2', input: '#E2DEF8', secondary: '#E2DEF8', bt: '#5B4BDB', bt2: '#4834D4' },
    dark: {},
  },
  B: {
    light: { background: '#FAF6EE', card: '#FFFEFA', text: '#1F1B3D', subText: '#6F6A7D', accent: '#4C3FBF', button: '#4C3FBF', border: '#E6DDC8', input: '#F1EADB', secondary: '#F1EADB', bt: '#4C3FBF', bt2: '#3A2F9E', hl: '#F0764F', warn: '#FDEEE6' },
    dark: { background: '#17141F', card: '#221F2E', text: '#F6F1E6', subText: '#AAA3B8', accent: '#A99BFF', border: '#3A3548', input: '#2C2839', secondary: '#2C2839', bt: '#5A4DD0', bt2: '#43379F', hl: '#FF8A63', warn: '#3B2A2A' },
  },
  C: {
    light: { background: '#E1F5EE', text: '#1E1B4B', subText: '#4E6B63', accent: '#5B4BDB', button: '#5B4BDB', border: '#BFE3D2', input: '#CDEBDD', secondary: '#CDEBDD', bt: '#5B4BDB', bt2: '#4834D4' },
    dark: { background: '#0F1F1B', card: '#172B26', text: '#E6F7F0', subText: '#8FB5A8', accent: '#9A8CFF', border: '#2B4A41', input: '#1F3A33', secondary: '#1F3A33', bt: '#5B4BDB', bt2: '#4834D4', warn: '#3A2A26' },
  },
};

function build(letter) {
  const p = PALETTES[letter] || PALETTES.A;
  return { light: { ...BASE.light, ...p.light }, dark: { ...BASE.dark, ...p.dark } };
}

export const AcademicColors = build(ACTIVE_PALETTE);

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    try {
      const saved = getTheme();
      setCurrentTheme(saved === 'dark' ? 'dark' : 'light');
    } catch (e) {
      // DB might not be ready, ignore safely
    }
  }, []);

  const toggleTheme = () => {
    const next = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(next);
    saveThemeToDB(next);
  };

  const colors = AcademicColors[currentTheme] || AcademicColors.light;

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
