import React, { createContext, useState, useContext, useEffect } from 'react';
import { getTheme, setTheme as saveThemeToDB } from './dbHelpers';

const ThemeContext = createContext();

export const AcademicColors = {
  light: {
    background: '#F4F1EA',
    card: '#FAF9F6',
    text: '#121212',
    subText: '#4A4A4A',
    accent: '#1B263B',
    border: '#121212',
    input: '#E0DFD5',
    secondary: '#E0DFD5',
    error: '#E63946',
    success: '#2D6A4F',
    warning: '#FFB74D',
    buttonText: '#FAF9F6'
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FAF9F6',
    subText: '#B0B0B0',
    accent: '#4DB6AC',
    border: '#FAF9F6',
    input: '#262626',
    secondary: '#262626',
    error: '#FF5252',
    success: '#81C784',
    warning: '#FFB74D',
    buttonText: '#121212'
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
