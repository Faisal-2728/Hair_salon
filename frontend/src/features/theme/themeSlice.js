import { createSlice } from '@reduxjs/toolkit'

// Theme color schemes
export const THEMES = {
  LUXURY_DARK: 'luxury_dark',
  ELEGANT_WHITE: 'elegant_white',
  ROYAL_PURPLE: 'royal_purple',
  OCEAN_BLUE: 'ocean_blue',
}

export const THEME_CONFIG = {
  luxury_dark: {
    name: 'Luxury Dark',
    primary: '#1f2937',
    accent: '#fbbf24',
    secondary: '#6366f1',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  elegant_white: {
    name: 'Elegant White',
    primary: '#f8fafc',
    accent: '#6366f1',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f1f5f9',
    text: '#1e293b',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  royal_purple: {
    name: 'Royal Purple',
    primary: '#4c1d95',
    accent: '#c084fc',
    secondary: '#7c3aed',
    background: '#2d1b4e',
    surface: '#3d2463',
    text: '#f3e8ff',
    border: '#6d28d9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  ocean_blue: {
    name: 'Ocean Blue',
    primary: '#0c4a6e',
    accent: '#06b6d4',
    secondary: '#0ea5e9',
    background: '#082f49',
    surface: '#0f3a54',
    text: '#f0f9ff',
    border: '#0369a1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
}

const initialState = {
  currentTheme: localStorage.getItem('salon_theme') || THEMES.ELEGANT_WHITE,
  mode: 'light',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark'
    },
    setTheme(state, action) {
      const themeName = action.payload
      if (THEME_CONFIG[themeName]) {
        state.currentTheme = themeName
        localStorage.setItem('salon_theme', themeName)
      }
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions
export default themeSlice.reducer
