'use client'

import { useState, useEffect } from 'react'
import DarkModeToggle from './DarkModeToggle'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  outputFormat: string
  onOutputFormatChange: (format: string) => void
  stripExif: boolean
  onStripExifChange: (strip: boolean) => void
  isConverting: boolean
}

export default function MobileSidebar({
  isOpen,
  onClose,
  outputFormat,
  onOutputFormatChange,
  stripExif,
  onStripExifChange,
  isConverting
}: MobileSidebarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Tool Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Settings */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
                  <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </h3>
                <DarkModeToggle />
              </div>
              
              {/* Output Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800 dark:text-white">Output Format</label>
                <select 
                  value={outputFormat}
                  onChange={(e) => onOutputFormatChange(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-800 dark:text-white"
                  disabled={isConverting}
                >
                  <option value="jpeg">HEIC → JPEG</option>
                  <option value="png">HEIC → PNG</option>
                </select>
                <p className="text-xs text-gray-600 dark:text-gray-400">Choose your preferred output format</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-white">Strip EXIF data</label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Remove metadata for privacy</p>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="mobileStripExif"
                    checked={stripExif}
                    onChange={(e) => onStripExifChange(e.target.checked)}
                    className="sr-only"
                    disabled={isConverting}
                  />
                  <div 
                    className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center ${
                      stripExif ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                    } ${isConverting ? 'cursor-not-allowed' : ''}`}
                    onClick={() => !isConverting && onStripExifChange(!stripExif)}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                      stripExif ? 'translate-x-5' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </h3>
              
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Privacy First</p>
                    <p>Files converted locally in your browser</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Fast & Free</p>
                    <p>Instant conversion, no software needed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 