'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface FileData {
  id: string
  name: string
  size: number
  status: 'pending' | 'converting' | 'completed' | 'error'
  convertedUrl?: string
  error?: string
  file?: File
}

export default function ConvertHeicToJpg() {
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
        setError('Failed to load HEIC conversion library. Please refresh the page and try again.')
      }
    }
    
    const timer = setTimeout(checkLibrary, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const validateFile = (file: File): string | null => {
    const isValidType = file.name.toLowerCase().match(/\.(heic|heif)$/)
    if (!isValidType) {
      return `${file.name} is not a valid HEIC/HEIF file`
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return `${file.name} is too large (max 10MB)`
    }
    
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
        file: file
      }
      
      validFiles.push(fileData)
    })
    
    if (errors.length > 0) {
      setError(errors.join(', '))
      return
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
      
      setTimeout(() => {
        convertFiles(validFiles)
      }, 100)
    }
  }

  const convertFiles = async (filesToConvert: FileData[]) => {
    setIsConverting(true)
    
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

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'converting' } : f
      ))
      
      setTimeout(() => {
        setFiles(prev => [...prev])
      }, 50)

      try {
        if (!(fileData.file instanceof Blob)) {
          throw new Error('File is not a valid Blob object')
        }
        
        const fileBlob = new Blob([fileData.file], { type: fileData.file.type })
        const formatString = outputFormat === 'jpeg' ? 'JPEG' : 'PNG'
        
        const conversionOptions = {
          blob: fileBlob,
          toType: formatString,
          quality: 0.8
        }
        
        let convertedBlob
        try {
          convertedBlob = await heic2any(conversionOptions)
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
        
        const expectedMimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
        
        if (convertedBlob.type !== expectedMimeType) {
          if (outputFormat === 'jpeg' && convertedBlob.type === 'image/png') {
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
              continue
            } catch (canvasErr) {
              console.error('Canvas conversion failed:', canvasErr)
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
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-red-500 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">Convert HEIC to JPG</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Convert HEIC to JPG - Free Online Converter</h1>
          <p className="text-xl text-gray-600 mb-6">Transform your HEIC files to JPG format instantly with our free online converter</p>
        </div>

        {/* Converter Tool */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">HEIC to JPG Converter Tool</h2>
            <p className="text-gray-600">Upload your HEIC files and convert them to JPG format in seconds</p>
          </div>

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

          {/* Drop Zone */}
          {files.length === 0 && (
            <div className="text-center">
              {!libraryLoaded ? (
                <div className="opacity-50 cursor-not-allowed">
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
                  className={`group cursor-pointer mx-auto max-w-md ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isConverting && fileInputRef.current?.click()}
                >
                  <div className="space-y-8 flex flex-col items-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 transition-colors">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-100 group-hover:bg-red-200">
                        <svg className="w-10 h-10 transition-all duration-300 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-4 text-center">
                      <h3 className="text-2xl font-bold transition-colors duration-300 text-red-600">
                        Drop your HEIC files here
                      </h3>
                      <p className="text-lg transition-colors duration-300 text-red-500">
                        or click to browse files
                      </p>
                    </div>

                    <div className="text-sm text-gray-500 text-center">
                      Supports .heic and .heif files up to 10MB
                    </div>

                    <button 
                      type="button" 
                      className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 bg-red-500 text-white hover:bg-red-600"
                      disabled={isConverting}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Choose HEIC Files
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Files ({files.length})</h3>
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
              </div>

              <div className="space-y-3">
                {files.map((fileData) => (
                  <div key={fileData.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
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
                          className="px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200"
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

        {/* SEO Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Convert HEIC to JPG - Complete Guide</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Our <strong>HEIC to JPG converter</strong> is the most reliable tool to <strong>convert HEIC to JPG</strong> format online. 
              Whether you're converting iPhone photos or need to <strong>convert HEIC to JPEG</strong> for better compatibility, 
              our free online tool makes it simple and secure.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Convert HEIC to JPG</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
              <li><strong>Upload your HEIC file</strong> - Drag and drop or click to browse your HEIC files</li>
              <li><strong>Choose output format</strong> - Select JPEG as your preferred format</li>
              <li><strong>Download converted file</strong> - Get your JPG file instantly after conversion</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Why Convert HEIC to JPG?</h3>
            <p className="text-gray-700 mb-6">
              HEIC (High Efficiency Image Container) is Apple's modern image format that offers superior compression compared to JPG. 
              However, many devices and platforms don't support HEIC files natively. Converting <strong>HEIC to JPG</strong> ensures 
              your photos can be viewed on any device, shared easily, and uploaded to any platform.
            </p>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-800 mb-3">Key Benefits of Our HEIC to JPG Converter:</h4>
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
    </div>
  )
} 