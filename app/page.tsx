'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import DarkModeToggle from './components/DarkModeToggle'
import MobileSidebar from './components/MobileSidebar'
import MobileLanguageSelector from './components/MobileLanguageSelector'

interface FileData {
  id: string
  name: string
  size: number
  status: 'pending' | 'converting' | 'completed' | 'error'
  convertedUrl?: string
  error?: string
  file?: File // Add the actual File object
}

export default function Home() {
  const [files, setFiles] = useState<FileData[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [stripExif, setStripExif] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // File input and drop zone refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Check if heic2any library is loaded
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 20 // 10 seconds maximum (20 * 500ms)
    
    const checkLibrary = () => {
      const heic2any = (window as any).heic2any
      
      if (heic2any && typeof heic2any === 'function') {
        setLibraryLoaded(true)
      } else if (retryCount < maxRetries) {
        retryCount++
        setTimeout(checkLibrary, 500)
      } else {
        console.error('HEIC conversion library failed to load after maximum retries')
        setError('Failed to load HEIC conversion library. Please refresh the page and try again.')
      }
    }
    
    // Start checking after a short delay to allow scripts to load
    const timer = setTimeout(checkLibrary, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const validateFile = (file: File): string | null => {
    // Check file extension
    const isValidType = file.name.toLowerCase().match(/\.(heic|heif)$/)
    if (!isValidType) {
      return `${file.name} is not a valid HEIC/HEIF file`
    }
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name} is too large (max 10MB)`
    }
    
    // Check MIME type if available
    if (file.type && !file.type.includes('heic') && !file.type.includes('heif') && file.type !== 'image/heic' && file.type !== 'image/heif') {
      console.warn(`File ${file.name} has MIME type ${file.type}, but we'll try to convert it anyway`)
    }
    
    return null
  }

  const handleFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList)
    
    const validFiles: FileData[] = []
    const errors: string[] = []
    
    filesArray.forEach((file, index) => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
        return
      }
      
      const fileData: FileData = {
        id: generateId(),
        name: file.name,
        size: file.size,
        status: 'pending',
        file: file // Store the actual File object
      }
      
      validFiles.push(fileData)
    })
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      
      // Start conversion immediately after adding files
      setTimeout(() => {
        convertFiles(validFiles)
      }, 100) // Small delay to ensure state is updated
    }
  }

  const convertFiles = async (filesToConvert: FileData[]) => {
    setIsConverting(true)
    
    // Check if heic2any library is loaded
    if (!libraryLoaded) {
      console.error('HEIC conversion library not loaded')
      setError('HEIC conversion library failed to load. Please refresh the page and try again.')
      setIsConverting(false)
      return
    }
    
    const heic2any = (window as any).heic2any
    
    for (const fileData of filesToConvert) {
      if (!fileData.file) {
        console.error('No file object found for:', fileData.name)
        continue
      }

      // Update file status to converting
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'converting' } : f
      ))
      
      // Force a re-render to show the status change
      setTimeout(() => {
        setFiles(prev => [...prev])
      }, 50)

      try {
        // Ensure we have a proper Blob/File object
        if (!(fileData.file instanceof Blob)) {
          throw new Error('File is not a valid Blob object')
        }
        
        // Create a fresh Blob from the file to ensure compatibility
        const fileBlob = new Blob([fileData.file], { type: fileData.file.type })
        
        // Create conversion options with different format approaches
        const formatString = outputFormat === 'jpeg' ? 'JPEG' : 'PNG'
        
        // Create conversion options
        const conversionOptions = {
          blob: fileBlob,
          toType: formatString,
          quality: 0.8
        }
        
        // Use the simplest form of heic2any call with proper error handling
        let convertedBlob
        try {
          // First try with options object and JPEG format
          convertedBlob = await heic2any(conversionOptions)
        } catch (err1) {
          try {
            // Try direct call with blob and JPEG format
            convertedBlob = await heic2any(fileBlob, 'JPEG')
          } catch (err2) {
            try {
              // Try with lowercase jpeg
              convertedBlob = await heic2any(fileBlob, 'jpeg')
            } catch (err3) {
              try {
                // Try with jpg
                convertedBlob = await heic2any(fileBlob, 'jpg')
              } catch (err4) {
                // Last resort: try with PNG
                convertedBlob = await heic2any(fileBlob, 'PNG')
              }
            }
          }
        }
        
        // Check if the conversion actually produced the expected format
        const expectedMimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
        
        if (convertedBlob.type !== expectedMimeType) {
          // If we wanted JPEG but got PNG, try to convert PNG to JPEG using canvas
          if (outputFormat === 'jpeg' && convertedBlob.type === 'image/png') {
            // Create a promise-based canvas conversion
            const convertPngToJpeg = (pngBlob: Blob): Promise<Blob> => {
              return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const img = new Image()
                
                img.onload = () => {
                  canvas.width = img.width
                  canvas.height = img.height
                  ctx?.drawImage(img, 0, 0)
                  
                  canvas.toBlob((jpegBlob) => {
                    if (jpegBlob) {
                      resolve(jpegBlob)
                    } else {
                      reject(new Error('Canvas conversion failed'))
                    }
                  }, 'image/jpeg', 0.8)
                }
                
                img.onerror = () => {
                  reject(new Error('Failed to load image for canvas conversion'))
                }
                
                img.src = URL.createObjectURL(pngBlob)
              })
            }
            
            try {
              const jpegBlob = await convertPngToJpeg(convertedBlob)
              const jpegUrl = URL.createObjectURL(jpegBlob)
              setFiles(prev => prev.map(f => 
                f.id === fileData.id ? { ...f, status: 'completed', convertedUrl: jpegUrl } : f
              ))
              continue // Skip the original blob processing
            } catch (canvasErr) {
              console.error('Canvas conversion failed:', canvasErr)
              // Fall back to the original PNG conversion
            }
          }
        }
        
        const url = URL.createObjectURL(convertedBlob)
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'completed', convertedUrl: url } : f
        ))
      } catch (err) {
        console.error('Conversion error for file:', fileData.name, err)
        setFiles(prev => prev.map(f => 
          f.id === fileData.id ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Conversion failed' } : f
        ))
      }
    }
    
    setIsConverting(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dropZoneRef.current?.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dropZoneRef.current?.classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dropZoneRef.current?.classList.remove('drag-over')
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const downloadFile = (fileData: FileData) => {
    if (fileData.convertedUrl) {
      const link = document.createElement('a')
      link.href = fileData.convertedUrl
      link.download = fileData.name.replace(/\.(heic|heif)$/i, `.${outputFormat}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const downloadAllFiles = () => {
    files.filter(f => f.status === 'completed').forEach(downloadFile)
  }

  const clearAllFiles = () => {
    setFiles([])
    setError('')
    setSuccess('')
  }

  const completedFiles = files.filter(f => f.status === 'completed')

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
        stripExif={stripExif}
        onStripExifChange={setStripExif}
        isConverting={isConverting}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
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
        <header className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Sidebar Toggle */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden -ml-2 p-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg border-l border-gray-200 dark:border-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-white">HEIC to JPG Converter - Convert HEIC to JPG Online Free</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Convert HEIC to JPG online instantly - Transform your iPhone photos from HEIC to JPEG format easily</p>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">Bookmark this tool—instant, private conversions any time.</p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={clearAllFiles}
                  disabled={isConverting}
                  className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200"
                >
                  Clear All
                </button>
                <button 
                  onClick={downloadAllFiles}
                  disabled={completedFiles.length === 0 || isConverting}
                  className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
                >
                  {completedFiles.length > 1 ? `Download All (${completedFiles.length})` : 'Download File'}
                </button>
              </div>
            )}
          </div>

          {/* Top-right language selection */}
          <div className="absolute top-2 right-4 flex items-center space-x-2">
            {/* Mobile Language Dropdown */}
            <MobileLanguageSelector currentLanguage="en" />
            
            {/* Desktop Language Flags */}
            <div className="hidden lg:flex items-center space-x-2">
              <a href="/" title="English" aria-label="English" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform">
                <span className="text-lg">🇺🇸</span>
              </a>
              <a href="/es/heic-a-jpg" title="Español" aria-label="Español" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform">
                <span className="text-lg">🇪🇸</span>
              </a>
              <a href="/de/heic-zu-jpg" title="Deutsch" aria-label="Deutsch" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform">
                <span className="text-lg">🇩🇪</span>
              </a>
              <a href="/pl/heic-na-jpg" title="Polski" aria-label="Polski" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform">
                <span className="text-lg">🇵🇱</span>
              </a>
            </div>
          </div>
        </header>

        {/* Changelog Banner */}
        <div className="bg-red-600 text-white py-3 lg:py-4 px-4 lg:px-6 rounded-xl shadow-lg mb-6 lg:mb-8 mx-4 lg:mx-8">
          <div className="flex items-center justify-center space-x-2 lg:space-x-3">
            <div className="flex space-x-1 lg:space-x-2">
              <span className="animate-bounce">🚀</span>
              <span className="animate-pulse">⚡</span>
              <span className="animate-bounce">🎯</span>
            </div>
            <span className="text-sm lg:text-lg font-semibold text-center">Now with 2x faster conversion + Dark Mode</span>
            <div className="flex space-x-1 lg:space-x-2">
              <span className="animate-pulse">🎯</span>
              <span className="animate-bounce">⚡</span>
              <span className="animate-pulse">🚀</span>
            </div>
          </div>
        </div>
        {/* Language Switcher removed (moved to header top-right) */}

        {/* Main Area */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="flex flex-col">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
                  <button 
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Drop Zone */}
            {files.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-2xl mx-auto text-center px-4">
                  {!libraryLoaded ? (
                    <div className="drop-zone opacity-50 cursor-not-allowed">
                      <div className="space-y-8 flex flex-col items-center">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-10 h-10 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                            Loading converter...
                          </h3>
                          <p className="text-lg text-gray-500 dark:text-gray-500">
                            Please wait while we load the HEIC conversion library
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      ref={dropZoneRef}
                      className={`drop-zone group cursor-pointer mx-auto ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => !isConverting && fileInputRef.current?.click()}
                    >
                      <div className="space-y-8 flex flex-col items-center">
                        {/* Icon */}
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
                            <svg className="w-10 h-10 transition-all duration-300 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-4 text-center">
                          <h3 className="text-xl lg:text-2xl font-bold transition-colors duration-300 text-red-600 dark:text-red-400">
                            Drop your HEIC files here
                          </h3>
                          <p className="text-base lg:text-lg transition-colors duration-300 text-red-500 dark:text-red-400">
                            or click to browse files
                          </p>
                        </div>

                        {/* File info */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                          Supports .heic and .heif files up to 10MB
                        </div>

                        {/* Browse button */}
                        <button 
                          type="button" 
                          className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 bg-red-500 text-white hover:bg-red-600"
                          disabled={isConverting}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Choose Files
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Files ({files.length})
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button 
                      onClick={clearAllFiles}
                      disabled={isConverting}
                      className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={downloadAllFiles}
                      disabled={completedFiles.length === 0 || isConverting}
                      className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
                    >
                      {completedFiles.length > 1 ? `Download All (${completedFiles.length})` : 'Download File'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {files.map((fileData) => (
                    <div key={fileData.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{fileData.name}</p>
                            <p className={`text-sm ${
                              fileData.status === 'pending' ? 'text-gray-500 dark:text-gray-400' :
                              fileData.status === 'converting' ? 'text-yellow-500 dark:text-yellow-400' :
                              fileData.status === 'completed' ? 'text-green-500 dark:text-green-400' :
                              'text-red-500 dark:text-red-400'
                            }`}>
                              {fileData.status === 'pending' && '⏳ Waiting to convert...'}
                              {fileData.status === 'converting' && '🔄 Converting...'}
                              {fileData.status === 'completed' && '✅ Ready for download'}
                              {fileData.status === 'error' && `❌ Error: ${fileData.error || 'Unknown error'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {fileData.status === 'completed' && (
                          <button 
                            onClick={() => downloadFile(fileData)}
                            className="download-btn px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200"
                          >
                            Download
                          </button>
                        )}
                        
                        {fileData.status === 'error' && (
                          <span className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Content Section */}
          <section className="mt-12 lg:mt-16 bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-8 shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Convert HEIC to JPG Online - Free & Secure
            </h2>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our HEIC to JPG converter is the fastest and most reliable way to convert your iPhone photos online. 
                No software installation required - just upload your HEIC files and get high-quality JPG images instantly.
              </p>
              
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Why Convert HEIC to JPG?
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>JPG format is universally compatible with all devices and platforms</li>
                <li>Easier to share and upload to social media</li>
                <li>Smaller file sizes for faster sharing</li>
                <li>Better compatibility with photo editing software</li>
              </ul>
              
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                How Our Converter Works
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our advanced conversion technology ensures your photos maintain their quality while converting from HEIC to JPG format. 
                The process is completely secure and your files are automatically deleted after conversion.
              </p>
            </div>
          </section>

          {/* FAQ Section for Featured Snippets */}
          <section className="mt-12 lg:mt-16 bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-8 shadow-lg">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6 lg:mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6 lg:space-y-8">
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How to convert HEIC to JPG without iPhone?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Use our web tool in 3 steps: 1) Upload HEIC 2) Click Convert 3) Download JPG. 
                  No iPhone or special software needed - just any web browser on any device.
                </p>
              </div>
              
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Is HEIC to JPG conversion free?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Yes, our HEIC to JPG converter is completely free to use. No registration, no hidden fees, 
                  and no watermarks on your converted images.
                </p>
              </div>
              
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How long does HEIC to JPG conversion take?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Conversion is instant! Most HEIC files convert to JPG in under 5 seconds. 
                  Larger files may take up to 30 seconds depending on your internet speed.
                </p>
              </div>
              
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Will I lose quality when converting HEIC to JPG?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Our converter maintains excellent image quality. HEIC and JPG are both lossy formats, 
                  so the quality difference is minimal and often imperceptible to the human eye.
                </p>
              </div>
              
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Can I convert multiple HEIC files at once?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Yes! You can upload multiple HEIC files simultaneously. Our batch conversion feature 
                  processes all files efficiently and provides individual download links for each converted image.
                </p>
              </div>
              
              <div className="faq-section">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Is my data safe when using the HEIC converter?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm lg:text-base">
                  Absolutely! We prioritize your privacy and security. All uploaded files are automatically 
                  deleted after conversion, and we never store or access your personal photos.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* SEO-Only Article Content - Hidden from users but visible to search engines */}
        <section 
          className="sr-only" 
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap'
          }}
        >
          <article className="prose prose-lg max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">HEIC Image Format: A Comprehensive Report</h1>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Technical Specifications of HEIC</h2>
            <p className="text-gray-700 mb-4">
              <strong>Format and Structure:</strong> HEIC stands for High Efficiency Image Container, and it is essentially the container file format for images under the HEIF standard (High Efficiency Image File Format) developed by MPEG. HEIC is built on the ISO Base Media File Format structure (the same foundation as MP4 video files), meaning image data and metadata are organized in a series of boxes/atoms within the file. Each HEIC file begins with a file type box (ftyp) identifying it as an HEIF/HEIC file via a brand code (for example, heic or heix). The <strong>.heic extension</strong> is commonly used for HEVC-compressed HEIF images (single images), while <strong>.heics</strong> may denote image sequence files (multiple images). Apple devices use the .heic extension for photos and pronounce it "heek".
            </p>
            
            <p className="text-gray-700 mb-4">
              <strong>Compression Codec:</strong> HEIC uses the High Efficiency Video Coding (<strong>HEVC</strong>, also known as H.265) codec for image compression by default. In practice, a HEIC image is like a single intra-coded video frame encoded with HEVC's advanced compression algorithms. This modern codec allows HEIC to store images in <strong>half the file size of an equivalent quality JPEG</strong>. HEVC-based still-image encoding (sometimes called the HEVC Main Still Picture profile) offers much more efficient compression than the older JPEG's DCT-based compression. HEIC also supports <strong>lossless compression</strong> modes – the HEIF specification allows images to be saved without quality loss, though most HEIC photos (such as those from phones) are saved with lossy compression for maximum size savings.
            </p>
            
            <p className="text-gray-700 mb-6">
              <strong>Color Depth and Quality:</strong> HEIC supports <strong>deep color and high dynamic range</strong> imaging. While JPEG is limited to 8-bit per channel (256 levels per color, ~16.7 million colors total), HEIC images can be <strong>10-bit, 12-bit, or even 16-bit</strong> per color channel. In practical use, many HEIC photos are 10-bit, which allows over a billion possible colors and enables true HDR photos with extended dynamic range and smoother gradients. For example, recent smartphones and high-end cameras use 10-bit HEIF/HEIC to capture more vibrant HDR images with wide color gamuts (such as Rec.2020 or P3 color primaries).
            </p>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Compression Methods and Efficiency</h2>
            <p className="text-gray-700 mb-4">
              HEIC achieves its high compression efficiency primarily through the power of the <strong>HEVC (H.265) compression algorithm</strong>. HEVC was designed for high-resolution video (4K and beyond), and it brings those advanced techniques to still image coding in HEIC. Key factors in how HEIC <strong>maintains quality while reducing file size</strong> include:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li><strong>Advanced Intra-Frame Compression:</strong> HEVC uses more flexible and complex intra-frame compression than JPEG's 1990s-era algorithm. Instead of fixed 8×8 blocks with DCT (discrete cosine transform) as in JPEG, HEVC can use variable block sizes up to 64×64 pixels and many more intra-prediction modes to find the most efficient way to represent an image region.</li>
              <li><strong>Efficient Entropy Coding:</strong> HEVC employs modern entropy coding (like CABAC – Context-Adaptive Binary Arithmetic Coding) which packs bits more efficiently than the older Huffman coding used in JPEG. This further squeezes the image data without losing detail, contributing to the significant bitrate reduction.</li>
              <li><strong>High Precision and Less Data Loss:</strong> Because HEIC supports higher bit depth and more sophisticated color compression, it retains fine details and color gradients better than JPEG. For example, an HEIC photo can preserve subtle variations in skies or shadows without banding, even at high compression, thanks to 10-bit color and HEVC's precision.</li>
              <li><strong>Multiple Image Compression:</strong> When multiple images are stored in one HEIC container (such as burst shots or an image sequence), the format can employ inter-frame compression similar to a video codec. Redundant information between frames can be stored once and reused, drastically cutting down total size for sequences.</li>
              <li><strong>Optional Lossless Mode:</strong> While HEIC is usually used as a lossy format, HEIF also supports a lossless compression mode. In lossless mode, the image is compressed such that it can be decoded to an exact pixel-for-pixel copy of the original.</li>
            </ul>
            
            <p className="text-gray-700 mb-6">
              All these methods mean that HEIC can <strong>retain higher image quality at a fraction of the file size</strong> compared to older formats. Users typically observe that HEIC images maintain clarity and detail even at aggressive compression settings, where an equivalent JPEG would show noticeable degradation. One source notes that HEIC achieves roughly a <strong>50% file size reduction with no visible quality loss</strong> – effectively doubling storage capacity for photos.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Comparison with JPEG, PNG, and WebP</h2>
            <p className="text-gray-700 mb-4">
              HEIC is one of the "next-generation" image formats, and it differs from older formats like JPEG and PNG, as well as fellow modern format WebP, in several ways. The following table provides a high-level comparison of <strong>HEIC vs. JPEG vs. PNG vs. WebP</strong> in terms of compression, quality, and features:
            </p>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Feature</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">JPEG (JPG)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">PNG</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">WebP</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">HEIC (HEIF/HEVC)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Compression Type</td>
                    <td className="border border-gray-300 px-4 py-2">Lossy only (DCT-based)</td>
                    <td className="border border-gray-300 px-4 py-2">Lossless only</td>
                    <td className="border border-gray-300 px-4 py-2">Both lossy and lossless</td>
                    <td className="border border-gray-300 px-4 py-2">Both lossy and lossless</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">Typical File Size</td>
                    <td className="border border-gray-300 px-4 py-2">Baseline standard</td>
                    <td className="border border-gray-300 px-4 py-2">Very large for photos</td>
                    <td className="border border-gray-300 px-4 py-2">~25–35% smaller than JPEG</td>
                    <td className="border border-gray-300 px-4 py-2">~50% smaller than JPEG</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Color Depth</td>
                    <td className="border border-gray-300 px-4 py-2">8-bit per channel</td>
                    <td className="border border-gray-300 px-4 py-2">Up to 16-bit per channel</td>
                    <td className="border border-gray-300 px-4 py-2">8-bit per channel</td>
                    <td className="border border-gray-300 px-4 py-2">8, 10, 12, or 16-bit</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">Transparency</td>
                    <td className="border border-gray-300 px-4 py-2">No</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Animation</td>
                    <td className="border border-gray-300 px-4 py-2">No</td>
                    <td className="border border-gray-300 px-4 py-2">No (APNG extension)</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                    <td className="border border-gray-300 px-4 py-2">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-gray-700 mb-6">
              <strong>Comparison Highlights:</strong> In summary, <strong>HEIC offers superior compression and more features</strong> than the older JPEG and PNG formats, albeit with less universal support. Compared to <strong>JPEG</strong>, HEIC produces <strong>much smaller files for the same quality</strong> – often around 50% size savings. This is a major advantage in storage and bandwidth. HEIC also supports transparency and advanced features that JPEG cannot (JPEG has no alpha channel or multi-frame capability). Additionally, HEIC's support for 10-bit color means it can store <strong>HDR images</strong> with far more color detail than JPEG's 8-bit limitation.
            </p>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Device and Software Support for HEIC</h2>
            <p className="text-gray-700 mb-4">
              Despite its technical advantages, HEIC's adoption has been uneven. Support varies across different operating systems, devices, and applications. Below is an overview of <strong>where HEIC is supported natively, where it requires add-ons, and where it's not supported</strong>:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li><strong>Apple Ecosystem:</strong> Apple was the first major adopter of HEIC. iOS 11 and later (since the iPhone 7 in 2017) save photos in HEIC format by default. All modern iPhones and iPads (iOS/iPadOS) have native support: you can view, edit, and share HEIC photos seamlessly in the Photos app or any app using the system image picker. macOS High Sierra (10.13) and later on Macs likewise have built-in support.</li>
              <li><strong>Windows:</strong> Microsoft added HEIC support starting with Windows 10 (version 1803, released 2018), but it's not enabled out-of-the-box by default. Windows uses a system of extensions: users must install the HEIF Image Extensions (free) from Microsoft, and for HEVC decoding Windows 10 also requires the HEVC Video Extensions (a small paid add-on in the Store).</li>
              <li><strong>Android:</strong> Android's support for HEIC/HEIF has improved over time. Basic HEIF support (for decoding images) was added in Android 8.0 Oreo. Full support for capturing HEIC photos arrived in Android 10 (2019) on devices with the proper hardware encoders.</li>
              <li><strong>Web Browsers:</strong> At present, web browser support for HEIC is very limited. As of mid-2024, Apple Safari (on macOS and iOS) is the only major browser that can display HEIC images natively. Other browsers like Chrome, Firefox, and Edge do not support using HEIC files in &lt;img&gt; tags or CSS by default.</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Conversion and Usage in Workflows</h2>
            <p className="text-gray-700 mb-4">
              Given the patchy support, converting HEIC images to more common formats is a frequent task. Here are <strong>tools and methods for converting and using HEIC files</strong> in typical workflows:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li><strong>Within Apple Ecosystem:</strong> If you stay within Apple devices, you usually don't need to convert – macOS and iOS handle HEIC transparently. However, when sharing or exporting out, Apple provides automatic conversion options. For example, when you AirDrop a photo to an older Mac or send via iMessage to an Android, the system may convert the HEIC to JPEG on-the-fly for compatibility.</li>
              <li><strong>Windows Conversion:</strong> On Windows 10/11, once you have the HEIF and HEVC extensions installed, you can open HEIC images in the Photos app or even MS Paint. A simple method to convert one image is to open it in Paint and then use File &gt; Save As to save a copy as JPEG or PNG.</li>
              <li><strong>Using Adobe or Other Software:</strong> If you have Adobe Photoshop, you can open HEIC files (ensure the Windows codecs are installed if on Windows). Once opened, you can simply Save As or export to your desired format. Adobe Lightroom Classic can import HEIC images and you can then export them as JPEG, DNG, etc. with your edits.</li>
              <li><strong>Online Converters:</strong> Numerous free online tools can convert HEIC to JPEG/PNG; for example, browser-based services where you upload .heic files and get back JPEGs. These are handy if you just have a few images and are on a device that doesn't support HEIC.</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Conclusion</h2>
            <p className="text-gray-700 mb-4">
              HEIC is a <strong>technically advanced image format</strong> that brings high efficiency and new capabilities to photography. It offers superior compression (smaller file sizes) while retaining excellent quality, support for deep color and HDR, the ability to hold multiple images or even video in one file, and features like transparency and rich metadata that go beyond what JPEG and PNG can do.
            </p>
            
            <p className="text-gray-700 mb-4">
              However, as a new format, HEIC comes with challenges. <strong>Compatibility</strong> is the biggest hurdle – not all software and platforms can handle HEIC natively, especially outside of the Apple ecosystem. This has led to a period where users and professionals often need to convert HEIC files to more ubiquitous formats like JPEG for broader sharing and use.
            </p>
            
                         <p className="text-gray-700">
               Looking forward, as operating systems and software continue to integrate HEIC support – and with even newer formats like AVIF gaining traction – we can expect the image format landscape to evolve. HEIC has established itself firmly, thanks in large part to Apple's adoption and the format's genuine benefits. It may not completely replace JPEG in the immediate future, but it has carved out an important role in imaging.
             </p>
          </article>
        </section>
      </div>

      {/* Hidden file input */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".heic,.heif" 
        multiple 
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
} 