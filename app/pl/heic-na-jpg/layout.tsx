import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Konwerter HEIC na JPG Online - Darmowy ⚡ Bez Instalacji (100% Bezpieczny)',
  description: 'Konwertuj HEIC na JPG online za darmo natychmiast. Najlepszy konwerter HEIC na JPEG. Konwertuj zdjęcia iPhone z HEIC na format JPG łatwo. Bez rejestracji, skupiony na prywatności.',
  keywords: 'heic na jpg, konwerter heic na jpg, heic na jpeg, .heic na jpg, konwerter heic online, darmowy heic na jpg, narzędzie heic na jpg, konwerter zdjęć iphone, heic na jpg darmowy, konwertuj pliki heic',
  alternates: {
    canonical: 'https://heic-to-jpg.io/pl/heic-na-jpg',
  },
  openGraph: {
    title: 'Konwerter HEIC na JPG Online - Darmowy ⚡ Bez Instalacji (100% Bezpieczny)',
    description: 'Konwertuj HEIC na JPG online za darmo natychmiast. Najlepszy konwerter HEIC na JPEG. Konwertuj zdjęcia iPhone z HEIC na format JPG łatwo.',
    url: 'https://heic-to-jpg.io/pl/heic-na-jpg',
    locale: 'pl_PL',
  },
}

export default function PolishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 