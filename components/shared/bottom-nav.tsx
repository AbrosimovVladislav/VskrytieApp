'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Clock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Search, label: 'Анализ' },
  { href: '/history', icon: Clock, label: 'История' },
  { href: '/settings', icon: Settings, label: 'Настройки' },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-bg-secondary border-t border-border z-50">
      <div className="flex h-full">
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
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={cn(
                'text-[10px] font-medium tracking-wide',
                isActive ? 'text-accent' : 'text-muted'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
