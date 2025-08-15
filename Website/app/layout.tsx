import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HEIC to JPG Converter Online - Free ⚡ No Installation (100% Secure)',
  description: 'Convert HEIC to JPG online for free instantly. Best HEIC to JPEG converter tool. Convert iPhone photos from HEIC to JPG format easily. No registration, privacy-focused.',
  keywords: 'heic to jpg, convert heic to jpg, heic to jpg converter, heic to jpeg, .heic to jpg, heic converter online, free heic to jpg, heic to jpg tool, iphone photo converter, heic to jpg free, convert heic files',
  authors: [{ name: 'HEIC to JPG Converter' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    type: 'website',
    url: 'https://heic-to-jpg.io/',
    title: 'HEIC to JPG Converter Online - Free ⚡ No Installation (100% Secure)',
    description: 'Convert HEIC to JPG online for free instantly. Best HEIC to JPEG converter tool. Convert iPhone photos from HEIC to JPG format easily.',
    images: ['https://heic-to-jpg.io/og-image.jpg'],
    siteName: 'HEIC to JPG Converter',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEIC to JPG Converter Online - Free ⚡ No Installation (100% Secure)',
    description: 'Convert HEIC to JPG online for free instantly. Best HEIC to JPEG converter tool. Convert iPhone photos from HEIC to JPG format easily.',
    images: ['https://heic-to-jpg.io/og-image.jpg'],
    creator: '@heictojpg',
  },
  alternates: {
    canonical: 'https://heic-to-jpg.io/',
    languages: {
      'es': 'https://heic-to-jpg.io/es/heic-a-jpg',
      'de': 'https://heic-to-jpg.io/de/heic-zu-jpg',
    },
  },
  icons: {
    icon: '/images/favicon.ico',
    apple: '/images/apple-touch-icon.png',
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/heic2any.min.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      red: {
                        50: '#fef2f2',
                        100: '#fee2e2',
                        200: '#fecaca',
                        400: '#f87171',
                        500: '#ef4444',
                        600: '#dc2626',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Instant HEIC to JPG Converter",
              "operatingSystem": "All",
              "applicationCategory": "Online Converter Tool",
              "offers": {
                "@type": "Offer",
                "price": "0"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "HEIC to JPG Converter",
              "description": "Convert HEIC to JPG online for free instantly. Best HEIC to JPEG converter tool. Convert iPhone photos from HEIC to JPG format easily.",
              "url": "https://heic-to-jpg.io/",
              "applicationCategory": "UtilityApplication",
              "operatingSystem": "Web Browser",
              "browserRequirements": "Modern web browser with JavaScript enabled",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "featureList": [
                "Convert HEIC to JPG",
                "Convert HEIC to JPEG",
                "Convert HEIC to PNG",
                "Remove EXIF data",
                "Batch conversion",
                "No registration required",
                "Privacy-focused",
                "Instant conversion",
                "Free online tool"
              ],
              "author": {
                "@type": "Organization",
                "name": "HEIC to JPG Converter",
                "url": "https://heic-to-jpg.io/"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "datePublished": "2024-01-01",
              "dateModified": "2024-12-01"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I convert HEIC to JPG?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To convert HEIC to JPG, simply upload your HEIC file to our converter, choose JPEG as the output format, and download the converted file. The conversion happens instantly in your browser."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is HEIC to JPG conversion free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our HEIC to JPG converter is completely free to use. No registration or payment required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is the difference between HEIC and JPG?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "HEIC (High Efficiency Image Container) is Apple's image format that offers better compression than JPG. JPG is more widely compatible and can be opened on any device or platform."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I convert multiple HEIC files at once?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our converter supports batch conversion. You can upload multiple HEIC files and convert them all to JPG format simultaneously."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is my privacy protected when converting HEIC to JPG?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. All HEIC to JPG conversions happen locally in your browser. Your files are never uploaded to our servers, ensuring complete privacy."
                  }
                }
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Convert HEIC to JPG",
              "description": "Step-by-step guide to convert HEIC files to JPG format using our free online converter.",
              "image": "https://heic-to-jpg.io/og-image.jpg",
              "totalTime": "PT1M",
              "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": "0"
              },
              "supply": [
                {
                  "@type": "HowToSupply",
                  "name": "HEIC file"
                }
              ],
              "tool": [
                {
                  "@type": "HowToTool",
                  "name": "HEIC to JPG Converter"
                }
              ],
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Upload HEIC file",
                  "text": "Drag and drop your HEIC file or click to browse and select the file you want to convert.",
                  "image": "https://heic-to-jpg.io/step1.jpg"
                },
                {
                  "@type": "HowToStep",
                  "name": "Choose output format",
                  "text": "Select JPEG as your preferred output format from the settings panel.",
                  "image": "https://heic-to-jpg.io/step2.jpg"
                },
                {
                  "@type": "HowToStep",
                  "name": "Download converted file",
                  "text": "Once conversion is complete, click the download button to save your JPG file.",
                  "image": "https://heic-to-jpg.io/step3.jpg"
                }
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <div className="w-full bg-indigo-600 dark:bg-indigo-700 text-white text-center text-sm py-2 px-4">
          We’ve acquired
          {' '}
          <span className="font-semibold">
            converterwebptojpg.com
          </span>
          . Welcome new users!
        </div>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 