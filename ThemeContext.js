import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTheme, setTheme as saveThemeToDB } from './dbHelpers';

const ThemeContext = createContext();

export const AcademicColors = {
  light: {
    background: '#f7ede8',
    card: '#fff1ef',
    text: '#2f1b18',
    subText: '#6d493f',
    accent: '#b15a4b',
    accentLight: '#d19e95',
    accentDark: '#723a33',
    button: '#a14e3f',
    buttonHover: '#bd6b58',
    link: '#8f4f42',
    border: '#d9b5ae',
    input: '#f3e7e2',
    secondary: '#f8f1ee',
    error: '#c53030',
    success: '#2f855a',
    warning: '#c05621',
    buttonText: '#FFFFFF',
    gradientStart: '#b15a4b',
    gradientEnd: '#723a33',
    section1: '#faede9',
    section2: '#f7e3de',
    section3: '#eed0c7',
    section4: '#e8c5be'
  },
  dark: {
    background: '#1e1513',
    card: '#3f2c2a',
    text: '#f7f2ee',
    subText: '#d7c2bb',
    accent: '#c78575',
    accentLight: '#d6a69b',
    accentDark: '#8b5f58',
    button: '#ad6556',
    buttonHover: '#c98b7b',
    link: '#ddab9e',
    border: '#5e423e',
    input: '#3b2927',
    secondary: '#271d1c',
    error: '#fc8181',
    success: '#68d391',
    warning: '#f6e05e',
    buttonText: '#f7f2ee',
    gradientStart: '#c78575',
    gradientEnd: '#8b5f58',
    section1: '#50312d',
    section2: '#673f3b',
    section3: '#8b5f58',
    section4: '#b0847d'
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    try {
      const saved = getTheme();
      setCurrentTheme(saved);
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
