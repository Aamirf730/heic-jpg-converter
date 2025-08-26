import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HEIC zu JPG Konverter Online - Kostenlos ⚡ Keine Installation (100% Sicher)',
  description: 'Konvertieren Sie HEIC zu JPG online kostenlos sofort. Bester HEIC zu JPEG Konverter. Konvertieren Sie iPhone Fotos von HEIC zu JPG Format einfach. Keine Registrierung, datenschutzorientiert.',
  keywords: 'heic zu jpg, heic zu jpg konverter, heic zu jpeg, .heic zu jpg, heic konverter online, kostenlos heic zu jpg, heic zu jpg tool, iphone foto konverter, heic zu jpg kostenlos, heic dateien konvertieren',
  alternates: {
    canonical: 'https://heic-to-jpg.io/de/heic-zu-jpg',
  },
  openGraph: {
    title: 'HEIC zu JPG Konverter Online - Kostenlos ⚡ Keine Installation (100% Sicher)',
    description: 'Konvertieren Sie HEIC zu JPG online kostenlos sofort. Bester HEIC zu JPEG Konverter. Konvertieren Sie iPhone Fotos von HEIC zu JPG Format einfach.',
    url: 'https://heic-to-jpg.io/de/heic-zu-jpg',
    locale: 'de_DE',
  },
}

export default function GermanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 