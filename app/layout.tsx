import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/shared/bottom-nav'

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ВСКРЫТИЕ',
  description: 'Аналитический помощник для беттора',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={poppins.variable}>
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
