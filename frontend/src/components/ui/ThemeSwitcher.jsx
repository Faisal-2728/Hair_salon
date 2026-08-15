import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTheme, THEMES, THEME_CONFIG } from '../../features/theme/themeSlice'
import { motion } from 'framer-motion'

export const ThemeSwitcher = () => {
  const dispatch = useDispatch()
  const currentTheme = useSelector((state) => state.theme.currentTheme)
  const [isOpen, setIsOpen] = useState(false)

  const handleThemeChange = (themeName) => {
    dispatch(setTheme(themeName))
    setIsOpen(false)
  }

  const themeList = [
    { key: THEMES.ELEGANT_WHITE, name: 'Elegant White', icon: '☀️' },
    { key: THEMES.LUXURY_DARK, name: 'Luxury Dark', icon: '🌙' },
    { key: THEMES.ROYAL_PURPLE, name: 'Royal Purple', icon: '💜' },
    { key: THEMES.OCEAN_BLUE, name: 'Ocean Blue', icon: '🌊' },
  ]

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        title="Change theme"
      >
        🎨
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-48"
        >
          <div className="p-3 space-y-2">
            {themeList.map((theme) => (
              <button
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  currentTheme === theme.key
                    ? 'bg-indigo-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{theme.icon}</span>
                {theme.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ThemeSwitcher
