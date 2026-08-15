import { THEME_CONFIG } from '../features/theme/themeSlice'

export const applyTheme = (themeName) => {
  const theme = THEME_CONFIG[themeName]
  if (!theme) return

  // Create CSS variables for the theme
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    if (key !== 'name') {
      // Convert camelCase to kebab-case
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVarName, value)
    }
  })
}

export const getThemeColor = (colorKey, themeName) => {
  const theme = THEME_CONFIG[themeName]
  return theme ? theme[colorKey] : '#000'
}

export const createThemeStyles = (themeName) => {
  const theme = THEME_CONFIG[themeName]
  if (!theme) return {}

  return {
    backgroundColor: theme.background,
    color: theme.text,
    '--primary': theme.primary,
    '--accent': theme.accent,
    '--secondary': theme.secondary,
    '--surface': theme.surface,
    '--border': theme.border,
    '--success': theme.success,
    '--warning': theme.warning,
    '--error': theme.error,
  }
}

// Tailwind CSS theme generator
export const generateTailwindThemeConfig = (themeName) => {
  const theme = THEME_CONFIG[themeName]
  if (!theme) return {}

  return {
    colors: {
      primary: theme.primary,
      accent: theme.accent,
      secondary: theme.secondary,
      background: theme.background,
      surface: theme.surface,
      border: theme.border,
      success: theme.success,
      warning: theme.warning,
      error: theme.error,
    },
  }
}
