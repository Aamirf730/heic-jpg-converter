'use client'

import { useState, useRef, useEffect } from 'react'

interface Language {
  code: string
  name: string
  flag: string
  path: string
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', path: '/' },
  { code: 'es', name: 'Español', flag: '🇪🇸', path: '/es/heic-a-jpg' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', path: '/de/heic-zu-jpg' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', path: '/pl/heic-na-jpg' }
]

interface MobileLanguageSelectorProps {
  currentLanguage: string
}

export default function MobileLanguageSelector({ currentLanguage }: MobileLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(
    languages.find(lang => lang.code === currentLanguage) || languages[0]
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language)
    setIsOpen(false)
    // Navigate to the selected language page
    window.location.href = language.path
  }

  return (
    <div className="lg:hidden relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        <span className="text-base">{selectedLanguage.flag}</span>
        <span className="hidden sm:block">{selectedLanguage.name}</span>
        <svg 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language)}
                className={`w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                  selectedLanguage.code === language.code
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {selectedLanguage.code === language.code && (
                  <svg className="w-3 h-3 ml-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 