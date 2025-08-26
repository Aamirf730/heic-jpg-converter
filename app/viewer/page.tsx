'use client'

import { useState, useRef, useEffect } from 'react'
import DarkModeToggle from '../components/DarkModeToggle'
import MobileSidebar from '../components/MobileSidebar'
import MobileLanguageSelector from '../components/MobileLanguageSelector'

interface FileData {
  id: string
  name: string
  size: number
  status: 'pending' | 'loading' | 'viewing' | 'error'
  previewUrl?: string
  error?: string
  file?: File
}

export default function HeicViewer() {
  const [files, setFiles] = useState<FileData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [libraryLoaded, setLibraryLoaded] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set())

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Toggle FAQ expansion
  const toggleFaq = (index: number) => {
    const newExpandedFaqs = new Set(expandedFaqs)
    if (newExpandedFaqs.has(index)) {
      newExpandedFaqs.delete(index)
    } else {
      newExpandedFaqs.add(index)
    }
    setExpandedFaqs(newExpandedFaqs)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let retryCount = 0
    const maxRetries = 20

    const checkLibrary = () => {
      const heic2any = (window as any).heic2any
      if (heic2any && typeof heic2any === 'function') {
        setLibraryLoaded(true)
      } else if (retryCount < maxRetries) {
        retryCount++
        setTimeout(checkLibrary, 500)
      } else {
        console.error('HEIC conversion library failed to load after maximum retries')
        setError('HEIC viewing library failed to load. Please refresh the page and try again.')
      }
    }

    const timer = setTimeout(checkLibrary, 100)
    return () => clearTimeout(timer)
  }, [])

  const validateFile = (file: File): string | null => {
    const isValidType = file.name.toLowerCase().match(/\.(heic|heif)$/)
    if (!isValidType) return `${file.name} is not a valid HEIC/HEIF file`
    if (file.size > 50 * 1024 * 1024) return `${file.name} is too large (max 50MB)`
    if (file.type && !file.type.includes('heic') && !file.type.includes('heif') && file.type !== 'image/heic' && file.type !== 'image/heif') {
      console.warn(`File ${file.name} has MIME type ${file.type}, will attempt to view it anyway`)
    }
    return null
  }

  const handleFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList)
    const validFiles: FileData[] = []
    const errors: string[] = []

    filesArray.forEach((file) => {
      const err = validateFile(file)
      if (err) {
        errors.push(err)
        return
      }
      const fileData: FileData = { id: generateId(), name: file.name, size: file.size, status: 'pending', file }
      validFiles.push(fileData)
    })

    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      setTimeout(() => { loadFilesForViewing(validFiles) }, 100)
    }
  }

  const loadFilesForViewing = async (filesToLoad: FileData[]) => {
    setIsLoading(true)

    if (!libraryLoaded) {
      console.error('HEIC viewing library not loaded')
      setError('HEIC viewing library is not loaded. Please refresh the page and try again.')
      setIsLoading(false)
      return
    }

    const heic2any = (window as any).heic2any

    for (const fileData of filesToLoad) {
      if (!fileData.file) {
        console.error('No file object found for:', fileData.name)
        continue
      }

      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'loading' } : f))
      setTimeout(() => { setFiles(prev => [...prev]) }, 50)

      try {
        if (!(fileData.file instanceof Blob)) {
          throw new Error('File is not a valid Blob object')
        }
        const fileBlob = new Blob([fileData.file], { type: fileData.file.type })
        
        // Convert HEIC to a viewable format (JPEG for preview)
        let convertedBlob
        try {
          convertedBlob = await heic2any({ blob: fileBlob, toType: 'JPEG', quality: 0.9 })
        } catch (err1) {
          try { 
            convertedBlob = await heic2any(fileBlob, 'JPEG') 
          } catch (err2) {
            try { 
              convertedBlob = await heic2any(fileBlob, 'jpeg') 
            } catch (err3) {
              try { 
                convertedBlob = await heic2any(fileBlob, 'jpg') 
              } catch (err4) {
                convertedBlob = await heic2any(fileBlob, 'PNG')
              }
            }
          }
        }

        const url = URL.createObjectURL(convertedBlob)
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'viewing', previewUrl: url } : f))
        
        // Auto-select the first file for viewing
        if (!selectedFile) {
          setSelectedFile({ ...fileData, status: 'viewing', previewUrl: url })
        }
      } catch (err) {
        console.error('Viewing error for file:', fileData.name, err)
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Failed to load for viewing' } : f))
      }
    }

    setIsLoading(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.add('drag-over') }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.remove('drag-over') }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.remove('drag-over'); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }

  const selectFileForViewing = (fileData: FileData) => {
    if (fileData.status === 'viewing' && fileData.previewUrl) {
      setSelectedFile(fileData)
    }
  }

  const clearAllFiles = () => { 
    setFiles([]); 
    setSelectedFile(null);
    setError(''); 
    setSuccess('') 
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        outputFormat="jpeg"
        onOutputFormatChange={() => {}}
        stripExif={false}
        onStripExifChange={() => {}}
        isConverting={isLoading}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">HEIC Viewer</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View HEIC images without conversion</p>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </h3>
              <DarkModeToggle />
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">View Only Mode</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Images are converted temporarily for viewing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
              <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How it works
            </h3>
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Privacy First</p>
                  <p>Files are processed locally in your browser</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Fast & Free</p>
                  <p>Instant viewing, no software required</p>
                </div>
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
                <h1 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-white">HEIC Viewer - View HEIC Images Online</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">View HEIC images instantly without converting them – Browse your iPhone photos easily</p>
                <div className="flex items-center space-x-4 mt-3">
                  <a href="/" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600">
                    HEIC Converter
                  </a>
                  <a href="/viewer" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border-b-2 border-blue-600 dark:border-blue-400">
                    HEIC Viewer
                  </a>
                </div>
              </div>
            </div>
            
            {/* Top-right language selection */}
            <div className="absolute top-2 right-4 flex items-center space-x-2">
              {/* Mobile Language Dropdown */}
              <MobileLanguageSelector currentLanguage="en" />
              
              {/* Desktop Language Flags */}
              <div className="hidden lg:flex items-center space-x-2">
                <a href="/" title="English" aria-label="English" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform"><span className="text-lg">🇺🇸</span></a>
                <a href="/es/heic-a-jpg" title="Español" aria-label="Español" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform"><span className="text-lg">🇪🇸</span></a>
                <a href="/de/heic-zu-jpg" title="Deutsch" aria-label="Deutsch" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform"><span className="text-lg">🇩🇪</span></a>
                <a href="/pl/heic-na-jpg" title="Polski" aria-label="Polski" className="w-8 h-8 rounded-md bg-white dark:bg-gray-700 flex items-center justify-center shadow hover:scale-105 transition-transform"><span className="text-lg">🇵🇱</span></a>
              </div>
            </div>
          </div>
        </header>

        {/* Changelog Banner */}
        <div className="bg-blue-600 text-white py-4 px-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex space-x-2"><span className="animate-bounce">👁️</span><span className="animate-pulse">🔍</span><span className="animate-bounce">📱</span></div>
            <span className="text-lg font-semibold">New HEIC Viewer Tool - View HEIC images without conversion</span>
            <div className="flex space-x-2"><span className="animate-pulse">📱</span><span className="animate-bounce">🔍</span><span className="animate-pulse">👁️</span></div>
          </div>
        </div>

        {/* Main Area */}
        <main className="flex-1 p-8">
          <div className="flex flex-col">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                  <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
                  <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            )}

            {/* Drop Zone */}
            {files.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-2xl mx-auto text-center">
                  {!libraryLoaded ? (
                    <div className="drop-zone opacity-50 cursor-not-allowed">
                      <div className="space-y-8 flex flex-col items-center">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <svg className="w-10 h-10 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </div>
                        </div>
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Loading viewer...</h3>
                          <p className="text-lg text-gray-500 dark:text-gray-500">Please wait while we load the HEIC viewing library</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div ref={dropZoneRef} className={`drop-zone group cursor-pointer mx-auto ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isLoading && fileInputRef.current?.click()}>
                      <div className="space-y-8 flex flex-col items-center">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
                            <svg className="w-10 h-10 transition-all duration-300 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                        </div>
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold transition-colors duration-300 text-blue-600 dark:text-blue-400">Drop your HEIC files here</h3>
                          <p className="text-lg transition-colors duration-300 text-blue-500 dark:text-blue-400">or click to select files</p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">Compatible with .heic and .heif files up to 50MB</div>
                        <button type="button" className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 bg-blue-500 text-white hover:bg-blue-600" disabled={isLoading}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                          Select Files
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File List and Viewer */}
            {files.length > 0 && (
              <div className="flex-1 flex flex-col lg:flex-row gap-8">
                {/* File List */}
                <div className="lg:w-1/3">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Files ({files.length})
                    </h2>
                    <button onClick={clearAllFiles} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200">Clear All</button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((fileData) => (
                      <div 
                        key={fileData.id} 
                        className={`p-4 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 ${
                          selectedFile?.id === fileData.id 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => selectFileForViewing(fileData)}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            fileData.status === 'viewing' ? 'bg-green-100 dark:bg-green-900/30' : 
                            fileData.status === 'loading' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
                            fileData.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 
                            'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {fileData.status === 'viewing' && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            {fileData.status === 'loading' && <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                            {fileData.status === 'error' && <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                            {fileData.status === 'pending' && <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{fileData.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(fileData.size)}</p>
                            <p className={`text-xs ${
                              fileData.status === 'pending' ? 'text-gray-500 dark:text-gray-400' : 
                              fileData.status === 'loading' ? 'text-yellow-500 dark:text-yellow-400' : 
                              fileData.status === 'viewing' ? 'text-green-500 dark:text-green-400' : 
                              'text-red-500 dark:text-red-400'
                            }`}>
                              {fileData.status === 'pending' && '⏳ Waiting...'}
                              {fileData.status === 'loading' && '🔄 Loading...'}
                              {fileData.status === 'viewing' && '✅ Ready to view'}
                              {fileData.status === 'error' && `❌ Error: ${fileData.error || 'Unknown error'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Viewer */}
                <div className="lg:w-2/3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Image Viewer
                    </h3>
                    
                    {selectedFile && selectedFile.previewUrl ? (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p><strong>File:</strong> {selectedFile.name}</p>
                          <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                        </div>
                        <div className="flex justify-center">
                          <img 
                            src={selectedFile.previewUrl} 
                            alt={selectedFile.name}
                            className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
                            onError={(e) => {
                              console.error('Failed to load image preview')
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg">Select a file to view</p>
                        <p className="text-sm">Choose a HEIC file from the list to preview it here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEO Content Section */}
          <section className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">HEIC Viewer - View HEIC Images Online for Free</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Our <strong>HEIC Viewer</strong> tool allows you to view HEIC images instantly without converting them. Perfect for quickly browsing through your iPhone photos or checking HEIC files before deciding to convert them.</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Why use HEIC Viewer?</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>View HEIC images without losing quality through conversion</li>
                <li>Quick preview of multiple HEIC files</li>
                <li>No need to download or install software</li>
                <li>Perfect for checking photo content before sharing</li>
              </ul>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">How our HEIC Viewer works</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Our advanced technology temporarily converts HEIC images to a viewable format in your browser, allowing you to see the content without permanently changing the original file. The process is completely secure and files are automatically cleaned up after viewing.</p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  question: "How do I view HEIC images without converting them?",
                  answer: "Use our HEIC Viewer tool in 3 simple steps: 1) Upload your HEIC file 2) Wait for it to load 3) View the image in the browser. No conversion or download required - just instant viewing."
                },
                {
                  question: "Is HEIC viewing free?",
                  answer: "Yes, our HEIC Viewer is completely free to use. No registration, no hidden fees, and no watermarks on your images."
                },
                {
                  question: "How long does it take to load HEIC images?",
                  answer: "Loading is nearly instant! Most HEIC files load in less than 3 seconds. Larger files may take up to 10 seconds depending on your internet connection."
                },
                {
                  question: "Do I lose image quality when viewing?",
                  answer: "No quality loss occurs during viewing. We temporarily convert HEIC to a viewable format while preserving the original quality. Your original HEIC file remains unchanged."
                },
                {
                  question: "Can I view multiple HEIC files at once?",
                  answer: "Yes! You can upload several HEIC files simultaneously. Our viewer processes them efficiently and allows you to switch between different images easily."
                },
                {
                  question: "Are my files safe when viewing?",
                  answer: "Absolutely! All viewing is done locally in your browser. Your files are never uploaded to our servers and are automatically cleaned up after viewing."
                }
              ].map((faq, index) => (
                <div key={index} className="faq-section">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left py-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 focus:outline-none"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white pr-2">
                        {faq.question}
                      </h3>
                      <span className="text-gray-400 text-sm">
                        {expandedFaqs.has(index) ? '−' : '+'}
                      </span>
                    </div>
                  </button>
                  {expandedFaqs.has(index) && (
                    <div className="mt-2 ml-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".heic,.heif" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
    </div>
  )
} 