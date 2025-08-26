import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HEIC Viewer Online - View HEIC Images for Free',
  description: 'View HEIC images online for free. Our HEIC viewer allows you to preview HEIC files without converting them. No installation required, works in your browser.',
  alternates: {
    canonical: 'https://heic-to-jpg.io/viewer',
  },
  openGraph: {
    title: 'HEIC Viewer Online - View HEIC Images for Free',
    description: 'View HEIC images online for free. Our HEIC viewer allows you to preview HEIC files without converting them. No installation required, works in your browser.',
    url: 'https://heic-to-jpg.io/viewer',
  },
}

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 