import type { Metadata } from 'next'
import { Inter, Press_Start_2P } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/shared/bottom-nav'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const pressStart2P = Press_Start_2P({
  subsets: ['latin', 'cyrillic'],
  weight: ['400'],
  variable: '--font-press-start',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ВСКРЫТИЕ',
  description: 'Аналитический помощник для беттора',
}

export { viewport } from './viewport'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${pressStart2P.variable}`}>
      <body className="bg-bg text-text antialiased">
        <div className="mx-auto max-w-md min-h-screen flex flex-col relative">
          <main className="flex-1 pb-20">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
