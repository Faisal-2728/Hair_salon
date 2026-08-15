import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { applyTheme } from '../utils/themeUtils'

export const ThemeProvider = ({ children }) => {
  const currentTheme = useSelector((state) => state.theme.currentTheme)

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  return children
}

export default ThemeProvider
