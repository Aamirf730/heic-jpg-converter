import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Convertidor HEIC a JPG Online - Gratis ⚡ Sin Instalación (100% Seguro)',
  description: 'Convierte HEIC a JPG online gratis al instante. Mejor convertidor HEIC a JPEG. Convierte fotos de iPhone de HEIC a formato JPG fácilmente. Sin registro, enfocado en privacidad.',
  keywords: 'heic a jpg, convertidor heic a jpg, heic a jpeg, .heic a jpg, convertidor heic online, gratis heic a jpg, herramienta heic a jpg, convertidor fotos iphone, heic a jpg gratis, convertir archivos heic',
  alternates: {
    canonical: 'https://heic-to-jpg.io/es/heic-a-jpg',
  },
  openGraph: {
    title: 'Convertidor HEIC a JPG Online - Gratis ⚡ Sin Instalación (100% Seguro)',
    description: 'Convierte HEIC a JPG online gratis al instante. Mejor convertidor HEIC a JPEG. Convierte fotos de iPhone de HEIC a formato JPG fácilmente.',
    url: 'https://heic-to-jpg.io/es/heic-a-jpg',
    locale: 'es_ES',
  },
}

export default function SpanishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 