import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - HEIC to JPG Converter',
  description: 'Privacy policy for HEIC to JPG Converter. Learn how we protect your privacy and handle your data when using our free online HEIC to JPG conversion tool.',
  alternates: {
    canonical: 'https://heic-to-jpg.io/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy - HEIC to JPG Converter',
    description: 'Privacy policy for HEIC to JPG Converter. Learn how we protect your privacy and handle your data when using our free online HEIC to JPG conversion tool.',
    url: 'https://heic-to-jpg.io/privacy-policy',
  },
}

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 