import React from 'react'
import { useLanguage } from '../../providers/LanguageProvider'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang(lang === 'en' ? 'ne' : 'en')}
        className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
        aria-label="Switch language"
      >
        {lang === 'en' ? 'English' : 'नेपाली'}
      </button>
    </div>
  )
}
