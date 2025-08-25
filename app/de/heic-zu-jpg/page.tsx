'use client'

import { useState, useRef, useEffect } from 'react'
import DarkModeToggle from '../../components/DarkModeToggle'
import MobileSidebar from '../../components/MobileSidebar'
import MobileLanguageSelector from '../../components/MobileLanguageSelector'

interface FileData {
  id: string
  name: string
  size: number
  status: 'pending' | 'converting' | 'completed' | 'error'
  convertedUrl?: string
  error?: string
  file?: File
}

export default function HeicZuJpg() {
  const [files, setFiles] = useState<FileData[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [stripExif, setStripExif] = useState(false)
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
        setError('HEIC-Konvertierungsbibliothek konnte nicht geladen werden. Bitte Seite neu laden und erneut versuchen.')
      }
    }

    const timer = setTimeout(checkLibrary, 100)
    return () => clearTimeout(timer)
  }, [])

  const validateFile = (file: File): string | null => {
    const isValidType = file.name.toLowerCase().match(/\.(heic|heif)$/)
    if (!isValidType) return `${file.name} ist keine gültige HEIC/HEIF-Datei`
    if (file.size > 10 * 1024 * 1024) return `${file.name} ist zu groß (max. 10MB)`
    if (file.type && !file.type.includes('heic') && !file.type.includes('heif') && file.type !== 'image/heic' && file.type !== 'image/heif') {
      console.warn(`Datei ${file.name} hat MIME-Typ ${file.type}, versuchen es trotzdem zu konvertieren`)
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
      setTimeout(() => { convertFiles(validFiles) }, 100)
    }
  }

  const convertFiles = async (filesToConvert: FileData[]) => {
    setIsConverting(true)

    if (!libraryLoaded) {
      console.error('HEIC conversion library not loaded')
      setError('HEIC-Konvertierungsbibliothek nicht geladen. Bitte Seite neu laden und erneut versuchen.')
      setIsConverting(false)
      return
    }

    const heic2any = (window as any).heic2any

    for (const fileData of filesToConvert) {
      if (!fileData.file) {
        console.error('No file object found for:', fileData.name)
        continue
      }

      setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'converting' } : f))
      setTimeout(() => { setFiles(prev => [...prev]) }, 50)

      try {
        if (!(fileData.file instanceof Blob)) {
          throw new Error('File is not a valid Blob object')
        }
        const fileBlob = new Blob([fileData.file], { type: fileData.file.type })
        const formatString = outputFormat === 'jpeg' ? 'JPEG' : 'PNG'
        const conversionOptions = { blob: fileBlob, toType: formatString, quality: 0.8 }

        let convertedBlob
        try {
          convertedBlob = await heic2any(conversionOptions)
        } catch (err1) {
          try { convertedBlob = await heic2any(fileBlob, 'JPEG') } catch (err2) {
            try { convertedBlob = await heic2any(fileBlob, 'jpeg') } catch (err3) {
              try { convertedBlob = await heic2any(fileBlob, 'jpg') } catch (err4) {
                convertedBlob = await heic2any(fileBlob, 'PNG')
              }
            }
          }
        }

        const expectedMimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png'

        if (convertedBlob.type !== expectedMimeType) {
          if (outputFormat === 'jpeg' && convertedBlob.type === 'image/png') {
            const convertPngToJpeg = (pngBlob: Blob): Promise<Blob> => new Promise((resolve, reject) => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              const img = new Image()
              img.onload = () => {
                canvas.width = img.width
                canvas.height = img.height
                ctx?.drawImage(img, 0, 0)
                canvas.toBlob((jpegBlob) => {
                  if (jpegBlob) resolve(jpegBlob)
                  else reject(new Error('Canvas conversion failed'))
                }, 'image/jpeg', 0.8)
              }
              img.onerror = () => reject(new Error('Failed to load image for canvas conversion'))
              img.src = URL.createObjectURL(pngBlob)
            })

            try {
              const jpegBlob = await convertPngToJpeg(convertedBlob)
              const jpegUrl = URL.createObjectURL(jpegBlob)
              setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', convertedUrl: jpegUrl } : f))
              continue
            } catch (canvasErr) {
              console.error('Canvas conversion failed:', canvasErr)
            }
          }
        }

        const url = URL.createObjectURL(convertedBlob)
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', convertedUrl: url } : f))
      } catch (err) {
        console.error('Conversion error for file:', fileData.name, err)
        setFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Konvertierung fehlgeschlagen' } : f))
      }
    }

    setIsConverting(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.add('drag-over') }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.remove('drag-over') }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); dropZoneRef.current?.classList.remove('drag-over'); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }

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

  const downloadAllFiles = () => { files.filter(f => f.status === 'completed').forEach(downloadFile) }
  const clearAllFiles = () => { setFiles([]); setError(''); setSuccess('') }
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
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">HEIC zu JPG</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Datenschutzorientierter Konverter</p>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Einstellungen
              </h3>
              <DarkModeToggle />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800 dark:text-white">Ausgabeformat</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-800 dark:text-white"
                disabled={isConverting}
              >
                <option value="jpeg">HEIC → JPEG</option>
                <option value="png">HEIC → PNG</option>
              </select>
              <p className="text-xs text-gray-600 dark:text-gray-400">Wähle dein bevorzugtes Ausgabeformat</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <label className="text-sm font-semibold text-gray-800 dark:text-white">EXIF-Daten entfernen</label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Metadaten für Datenschutz entfernen</p>
              </div>
              <div className="relative">
                <input type="checkbox" id="stripExif" checked={stripExif} onChange={(e) => setStripExif(e.target.checked)} className="sr-only" disabled={isConverting} />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex items-center ${stripExif ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'} ${isConverting ? 'cursor-not-allowed' : ''}`} onClick={() => !isConverting && setStripExif(!stripExif)}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${stripExif ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
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
              Wie es funktioniert
            </h3>
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Datenschutz zuerst</p>
                  <p>Dateien werden lokal in deinem Browser konvertiert</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Schnell & Kostenlos</p>
                  <p>Sofortige Konvertierung, keine Software erforderlich</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sources and References */}
          <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-800 dark:text:white flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Quellen & Referenzen
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-gray-600 dark:text-gray-400 mb-3">Technische Quellen für HEIC-Format-Informationen:</p>
              <div className="space-y-2">
                <a href="https://www.outrightcrm.com/blog/what-is-heic-format/" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">HEIC Format Guide 2025</a>
                <a href="https://www.loc.gov/preservation/digital/formats/fdd/fdd000526.shtml" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">Library of Congress HEIC</a>
                <a href="https://www.adobe.com/creativecloud/file-types/image/raster/heic-file.html" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">Adobe HEIC Guide</a>
                <a href="https://de.wikipedia.org/wiki/High_Efficiency_Image_File_Format" target="_blank" rel="noopener noreferrer" className="block text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline text-xs">Wikipedia HEIF</a>
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
                <h1 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-white">HEIC zu JPG Konverter - Konvertiere HEIC zu JPG Online Kostenlos</h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Konvertiere HEIC zu JPG online sofort – Transformiere deine iPhone-Fotos vom HEIC- ins JPEG-Format einfach</p>
              </div>
            </div>
            
            {/* Top-right language selection */}
            <div className="absolute top-2 right-4 flex items-center space-x-2">
              {/* Mobile Language Dropdown */}
              <MobileLanguageSelector currentLanguage="de" />
              
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
        <div className="bg-red-600 text-white py-4 px-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex space-x-2"><span className="animate-bounce">🚀</span><span className="animate-pulse">⚡</span><span className="animate-bounce">🎯</span></div>
            <span className="text-lg font-semibold">Jetzt mit 2x schnellerer Konvertierung + Dark Mode</span>
            <div className="flex space-x-2"><span className="animate-pulse">🎯</span><span className="animate-bounce">⚡</span><span className="animate-pulse">🚀</span></div>
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
                          <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Konverter wird geladen...</h3>
                          <p className="text-lg text-gray-500 dark:text-gray-500">Bitte warte, während wir die HEIC-Konvertierungsbibliothek laden</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div ref={dropZoneRef} className={`drop-zone group cursor-pointer mx-auto ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => !isConverting && fileInputRef.current?.click()}>
                      <div className="space-y-8 flex flex-col items-center">
                        <div className="flex justify-center">
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
                            <svg className="w-10 h-10 transition-all duration-300 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          </div>
                        </div>
                        <div className="space-y-4 text-center">
                          <h3 className="text-2xl font-bold transition-colors duration-300 text-red-600 dark:text-red-400">Lege deine HEIC-Dateien hier ab</h3>
                          <p className="text-lg transition-colors duration-300 text-red-500 dark:text-red-400">oder klicke, um Dateien auszuwählen</p>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">Unterstützt .heic und .heif Dateien bis zu 10MB</div>
                        <button type="button" className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 bg-red-500 text-white hover:bg-red-600" disabled={isConverting}>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                          Dateien auswählen
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
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Dateien ({files.length})
                  </h2>
                  <div className="flex space-x-3">
                    <button onClick={clearAllFiles} disabled={isConverting} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-200">Alle löschen</button>
                    <button onClick={downloadAllFiles} disabled={completedFiles.length === 0 || isConverting} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200">{completedFiles.length > 1 ? `Alle herunterladen (${completedFiles.length})` : 'Datei herunterladen'}</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {files.map((fileData) => (
                    <div key={fileData.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{fileData.name}</p>
                            <p className={`text-sm ${fileData.status === 'pending' ? 'text-gray-500 dark:text-gray-400' : fileData.status === 'converting' ? 'text-yellow-500 dark:text-yellow-400' : fileData.status === 'completed' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                              {fileData.status === 'pending' && '⏳ Warte auf Konvertierung...'}
                              {fileData.status === 'converting' && '🔄 Konvertiere...'}
                              {fileData.status === 'completed' && '✅ Bereit zum Download'}
                              {fileData.status === 'error' && `❌ Fehler: ${fileData.error || 'Unbekannter Fehler'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {fileData.status === 'completed' && (
                          <button onClick={() => downloadFile(fileData)} className="download-btn px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200">Herunterladen</button>
                        )}
                        {fileData.status === 'error' && (
                          <span className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">Fehlgeschlagen</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Content Section */}
          <section className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">HEIC zu JPG online konvertieren – Kostenlos & Sicher</h2>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">Unser <a href="https://heic-to-jpg.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">HEIC-zu-JPG-Konverter</a> ist der schnellste und zuverlässigste Weg, deine iPhone-Fotos online zu konvertieren. Keine Softwareinstallation erforderlich – lade einfach deine HEIC-Dateien hoch und erhalte sofort hochwertige JPG-Bilder.</p>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Warum HEIC zu JPG konvertieren?</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>JPG-Format ist universell kompatibel mit allen Geräten und Plattformen</li>
                <li>Einfacher zu teilen und auf Social Media hochzuladen</li>
                <li>Kleinere Dateigrößen für schnelleres Teilen</li>
                <li>Bessere Kompatibilität mit Foto-Bearbeitungssoftware</li>
              </ul>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">Wie unser Konverter funktioniert</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Unsere fortschrittliche Technologie stellt sicher, dass deine Fotos ihre Qualität behalten, während sie vom HEIC- in das JPG-Format konvertiert werden. Der Prozess ist vollständig sicher und deine Dateien werden nach der Konvertierung automatisch gelöscht.</p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Häufig gestellte Fragen</h2>
            <div className="space-y-4">
              {[
                {
                  question: "Wie konvertiere ich HEIC zu JPG ohne iPhone?",
                  answer: "Verwende unser Web-Tool in 3 Schritten: 1) HEIC hochladen 2) Auf Konvertieren klicken 3) JPG herunterladen. Kein iPhone oder spezielle Software erforderlich – nur ein Webbrowser auf jedem Gerät."
                },
                {
                  question: "Ist die HEIC-zu-JPG-Konvertierung kostenlos?",
                  answer: "Ja, unser HEIC-zu-JPG-Konverter ist völlig kostenlos. Keine Registrierung, keine versteckten Gebühren und keine Wasserzeichen."
                },
                {
                  question: "Wie lange dauert die Konvertierung?",
                  answer: "Die Konvertierung ist sofort! Die meisten HEIC-Dateien werden in unter 5 Sekunden zu JPG konvertiert. Größere Dateien können bis zu 30 Sekunden dauern – abhängig von deiner Internetgeschwindigkeit."
                },
                {
                  question: "Verliere ich Qualität beim Konvertieren?",
                  answer: "Unser Konverter behält eine ausgezeichnete Bildqualität bei. HEIC und JPG sind beide verlustbehaftete Formate – der Qualitätsunterschied ist minimal und oft nicht wahrnehmbar."
                },
                {
                  question: "Kann ich mehrere HEIC-Dateien gleichzeitig konvertieren?",
                  answer: "Ja! Du kannst mehrere HEIC-Dateien gleichzeitig hochladen. Unser Batch-Feature verarbeitet alle Dateien effizient und bietet individuelle Download-Links für jedes konvertierte Bild."
                },
                {
                  question: "Sind meine Daten sicher?",
                  answer: "Absolut! Alle Konvertierungen erfolgen lokal in deinem Browser. Deine Dateien werden nie auf unsere Server hochgeladen."
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