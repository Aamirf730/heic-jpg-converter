'use client'

import { useState, useRef, useEffect } from 'react'

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
    <div className="bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center pb-6 border-b border-gray-200">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800">HEIC to JPG</h2>
            <p className="text-sm text-gray-600">Privacy-first converter</p>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </h3>
            
            {/* Output Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">Output Format</label>
              <select 
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isConverting}
              >
                <option value="jpeg">HEIC → JPEG</option>
                <option value="png">HEIC → PNG</option>
              </select>
              <p className="text-xs text-gray-600">Choose your preferred output format</p>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="text-sm font-semibold text-gray-800">Strip EXIF data</label>
                <p className="text-xs text-gray-600 mt-1">Remove metadata for privacy</p>
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
                    stripExif ? 'bg-red-500' : 'bg-gray-300'
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
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How it works
            </h3>
            
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Privacy First</p>
                  <p>Files converted locally in your browser</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Fast & Free</p>
                  <p>Instant conversion, no software needed</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Works Everywhere</p>
                  <p>All modern browsers, HEIC/HEIF support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">HEIC to JPG Converter - Convert HEIC to JPG Online Free</h1>
              <p className="text-gray-600">Convert HEIC to JPG online instantly - Transform your iPhone photos from HEIC to JPEG format easily</p>
            </div>
            
            {files.length > 0 && (
              <div className="flex space-x-3">
                <button 
                  onClick={clearAllFiles}
                  disabled={isConverting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                >
                  Clear All
                </button>
                <button 
                  onClick={downloadAllFiles}
                  disabled={completedFiles.length === 0 || isConverting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
                >
                  {completedFiles.length > 1 ? `Download All (${completedFiles.length})` : 'Download File'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-8">
          <div className="flex flex-col">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-red-500 hover:text-red-700 transition-colors"
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
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-800 font-medium">{success}</p>
                  <button 
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-500 hover:text-green-700 transition-colors"
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
                <div className="w-full max-w-2xl mx-auto text-center">
                  {!libraryLoaded ? (
                    <div className="drop-zone opacity-50 cursor-not-allowed">
                      <div className="space-y-8 flex flex-col items-center">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-gray-100">
                            <svg className="w-10 h-10 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                        </div>
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold text-gray-600">
                            Loading converter...
                          </h3>
                          <p className="text-lg text-gray-500">
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
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-100 group-hover:bg-red-200">
                            <svg className="w-10 h-10 transition-all duration-300 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>

                        {/* Text */}
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold transition-colors duration-300 text-red-600">
                            Drop your HEIC files here
                          </h3>
                          <p className="text-lg transition-colors duration-300 text-red-500">
                            or click to browse files
                          </p>
                        </div>

                        {/* File info */}
                        <div className="text-sm text-gray-500 text-center mt-4">
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Files ({files.length})
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {files.map((fileData) => (
                    <div key={fileData.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 truncate">{fileData.name}</p>
                            <p className={`text-sm ${
                              fileData.status === 'pending' ? 'text-gray-500' :
                              fileData.status === 'converting' ? 'text-yellow-500' :
                              fileData.status === 'completed' ? 'text-green-500' :
                              'text-red-500'
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
                          <span className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Content Section */}
          <div className="mt-16 bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Convert HEIC to JPG - Free Online HEIC to JPEG Converter</h2>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 mb-6">
                  Our <strong>HEIC to JPG converter</strong> is the best free online tool to <strong>convert HEIC to JPG</strong> format instantly. 
                  Whether you need to <strong>convert HEIC to JPEG</strong> for sharing photos or converting <strong>.heic to jpg</strong> files 
                  for better compatibility, our tool makes it simple and secure.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Why Convert HEIC to JPG?</h3>
                <p className="text-gray-700 mb-6">
                  HEIC (High Efficiency Image Container) is Apple's modern image format that offers superior compression compared to JPG. 
                  However, many devices and platforms don't support HEIC files natively. Converting <strong>HEIC to JPG</strong> ensures 
                  your photos can be viewed on any device, shared easily, and uploaded to any platform.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Convert HEIC to JPG</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
                  <li><strong>Upload your HEIC file</strong> - Drag and drop or click to browse your HEIC files</li>
                  <li><strong>Choose output format</strong> - Select JPEG or PNG as your preferred format</li>
                  <li><strong>Download converted file</strong> - Get your JPG file instantly after conversion</li>
                </ol>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Features of Our HEIC to JPG Converter</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  <li><strong>Free HEIC to JPG conversion</strong> - No registration or payment required</li>
                  <li><strong>Privacy-focused</strong> - All conversions happen locally in your browser</li>
                  <li><strong>Batch conversion</strong> - Convert multiple HEIC files at once</li>
                  <li><strong>Multiple formats</strong> - Convert to JPEG or PNG format</li>
                  <li><strong>Instant conversion</strong> - No waiting time, results in seconds</li>
                  <li><strong>High quality</strong> - Maintains image quality during conversion</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">How do I convert HEIC to JPG?</h4>
                    <p className="text-gray-700">Simply upload your HEIC file to our converter, choose JPEG as the output format, and download the converted file. The conversion happens instantly in your browser.</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Is HEIC to JPG conversion free?</h4>
                    <p className="text-gray-700">Yes, our HEIC to JPG converter is completely free to use. No registration or payment required.</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">What is the difference between HEIC and JPG?</h4>
                    <p className="text-gray-700">HEIC (High Efficiency Image Container) is Apple's image format that offers better compression than JPG. JPG is more widely compatible and can be opened on any device or platform.</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Can I convert multiple HEIC files at once?</h4>
                    <p className="text-gray-700">Yes, our converter supports batch conversion. You can upload multiple HEIC files and convert them all to JPG format simultaneously.</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Is my privacy protected when converting HEIC to JPG?</h4>
                    <p className="text-gray-700">Absolutely. All HEIC to JPG conversions happen locally in your browser. Your files are never uploaded to our servers, ensuring complete privacy.</p>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">Best HEIC to JPG Converter Online</h3>
                <p className="text-gray-700 mb-6">
                  Our <strong>HEIC to JPG converter</strong> is designed to be the most user-friendly and efficient tool for converting 
                  HEIC files to JPG format. With instant conversion, batch processing, and complete privacy protection, 
                  it's the perfect solution for anyone who needs to <strong>convert HEIC to JPG</strong> quickly and securely.
                </p>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Key Benefits:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Convert HEIC to JPG without losing quality</li>
                    <li>Free online tool - no software download required</li>
                    <li>Works on all devices and browsers</li>
                    <li>Instant conversion - no waiting time</li>
                    <li>100% privacy - files never leave your device</li>
                    <li>Support for both HEIC and HEIF formats</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
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