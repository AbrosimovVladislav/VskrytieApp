'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Wallet, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/history', icon: BarChart3, label: 'Анализы' },
  { href: '/balance', icon: Wallet, label: 'Баланс' },
  { href: '/settings', icon: Settings, label: 'Ещё' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-bg-secondary shadow-[--shadow-nav] z-50 pt-5 pb-8 px-4">
      <div className="flex items-center">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-accent' : 'text-muted'
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
