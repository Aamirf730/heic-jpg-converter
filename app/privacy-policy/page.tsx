'use client'

import Link from 'next/link'
import DarkModeToggle from '../components/DarkModeToggle'
import { useState } from 'react'

export default function PrivacyPolicy() {
  // Dummy state variables to match the sidebar from the main page
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [stripExif, setStripExif] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="block hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">HEIC to JPG</h2>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">Privacy-first converter</p>
          </div>

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
                onChange={(e) => setOutputFormat(e.target.value)}
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
                  id="stripExif"
                  checked={stripExif}
                  onChange={(e) => setStripExif(e.target.checked)}
                  className="sr-only"
                  disabled={isConverting}
                />
                <div 
                  className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center ${
                    stripExif ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                  } ${isConverting ? 'cursor-not-allowed' : ''}`}
                  onClick={() => !isConverting && setStripExif(!stripExif)}
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

          {/* Sources and References */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sources & References
            </h3>
            
            <div className="space-y-2 text-xs">
              <p className="text-gray-600 dark:text-gray-400 mb-3">Technical sources for HEIC format information:</p>
              
              <div className="space-y-2">
                <a href="https://www.outrightcrm.com/blog/what-is-heic-format/" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  HEIC Format Guide 2025
                </a>
                <a href="https://www.loc.gov/preservation/digital/formats/fdd/fdd000526.shtml" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Library of Congress HEIC
                </a>
                <a href="https://www.adobe.com/creativecloud/file-types/image/raster/heic-file.html" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Adobe HEIC Guide
                </a>
                <a href="https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Wikipedia HEIF
                </a>
                <a href="https://www.freecodecamp.org/news/best-image-format-for-web-in-2019-jpeg-webp-heic-avif-41ba0c1b2789/" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  FreeCodeCamp Image Formats
                </a>
                <a href="https://cloudinary.com/guides/image-formats/heif-vs-heic" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Cloudinary HEIF vs HEIC
                </a>
                <a href="https://help.picsart.io/hc/en-us/articles/27399210909085-What-Are-the-Pros-and-Cons-of-Using-HEIC" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Picsart HEIC Guide
                </a>
                <a href="https://medium.com/@adi.mizrahi/the-best-image-format-for-mobile-applications-5fa9c9bdc2f4" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Mobile Image Formats
                </a>
                <a href="https://afosto.com/blog/avif-vs-webp-format/" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  AVIF vs WebP
                </a>
                <a href="https://developers.google.com/speed/webp/faq" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  Google WebP FAQ
                </a>
                <a href="https://superuser.com/questions/1811863/easiest-way-to-convert-heic-to-jpeg-or-png" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">
                  SuperUser HEIC Conversion
                </a>
                <Link href="/privacy-policy" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs mt-4">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Privacy Policy</h1>
              <p className="text-gray-600 dark:text-gray-400">Our commitment to your privacy</p>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Privacy Commitment</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  At HEIC to JPG Converter, we are committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our website.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Storage of Images</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  <strong>Your images are never stored on our servers.</strong> Our HEIC to JPG conversion process happens entirely within your browser. 
                  The files you upload for conversion remain on your device and are processed locally. We do not have access to your images, 
                  and they are not transmitted to or stored on our servers at any point during the conversion process.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Collection of Personal Data</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We do not collect any personal information from our users. We do not request or store names, email addresses, 
                  or any other identifying information. You can use our service completely anonymously.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Google Analytics</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We use Google Analytics to help us understand how users interact with our website. 
                  This service collects anonymous usage data such as page views, time spent on the site, 
                  and the general geographic region of visitors. This information helps us improve our service.
                  Google Analytics may use cookies to collect this information, but no personally identifiable information is tracked.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How We Process Your Images</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  When you upload HEIC images to convert:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-6">
                  <li>The conversion happens entirely in your web browser using JavaScript</li>
                  <li>Your images are never sent to our servers</li>
                  <li>Once conversion is complete, you can download the JPG files directly to your device</li>
                  <li>No copies of your images are retained after you leave the page or close your browser</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Changes to Our Privacy Policy</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page, 
                  and if significant changes are made, we will provide a more prominent notice.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact Us</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  If you have any questions or concerns about our Privacy Policy, please contact us.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 