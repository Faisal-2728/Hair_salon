import React, { createContext, useContext, useEffect, useState } from 'react'

const LanguageContext = createContext()

const DEFAULT = 'en'

const translations = {
  en: {
    welcome_back: 'Welcome Back',
    sign_in_premium: 'Sign in to your premium salon account',
    email_or_username: 'Email or Username',
    password: 'Password',
    remember_me: 'Remember me',
    forgot_password: 'Forgot password?',
    sign_in: 'Sign In',
    signing_in: 'Signing in...',
    dont_have_account: "Don't have an account?",
    create_one: 'Create one',
    book_now: 'Book Now',
    book_appointment: 'Book Appointment',
  },
  ne: {
    welcome_back: 'फेरि स्वागत छ',
    sign_in_premium: 'तपाईंको प्रिमियम सैलुन खातामा साइन इन गर्नुहोस्',
    email_or_username: 'इमेल वा प्रयोगकर्ता नाम',
    password: 'पासवर्ड',
    remember_me: 'मलाई सम्झनुहोस्',
    forgot_password: 'पासवर्ड बिर्सनुभयो?',
    sign_in: 'साइन इन गर्नुहोस्',
    signing_in: 'साइन इन हुँदैछ...',
    dont_have_account: 'खाता छैन?',
    create_one: 'एक सिर्जना गर्नुहोस्',
    book_now: 'बुक गर्नुहोस्',
    book_appointment: 'अपोइन्टमेन्ट बुक गर्नुहोस्',
  },
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('salon_lang') || DEFAULT)

  useEffect(() => {
    localStorage.setItem('salon_lang', lang)
  }, [lang])

  const t = (key) => translations[lang]?.[key] || translations[DEFAULT][key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

export default LanguageProvider
