import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://karimosmangh.github.io'),
  title: 'Forest Impact Simulator - A tool to simulate and analyze the environmental impact of forest planting',
  description: 'Simulate the real-world impact of forests using live soil, climate, and biodiversity data. Plan tree planting projects with scientific accuracy and visualize carbon sequestration, biodiversity impact, and environmental benefits.',
  authors: [{ name: 'Karim Osman' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Forest Impact Simulator - Environmental Impact Analysis Tool',
    description: 'Simulate the real-world impact of forests using live soil, climate, and biodiversity data. Plan tree planting projects with scientific accuracy and visualize carbon sequestration, biodiversity impact, and environmental benefits.',
    url: '/Forest-Impact-Simulator/',
    siteName: 'Forest Impact Simulator',
    images: [
      {
        url: '/Forest-Impact-Simulator/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Forest Impact Simulator - Interactive map showing forest planting simulation with environmental impact metrics',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forest Impact Simulator - Environmental Impact Analysis Tool',
    description: 'Simulate the real-world impact of forests using live soil, climate, and biodiversity data. Plan tree planting projects with scientific accuracy.',
    images: ['/Forest-Impact-Simulator/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
