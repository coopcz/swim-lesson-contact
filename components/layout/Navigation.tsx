'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavItem {
  name: string
  href: string
  icon?: string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/' },
  { name: 'Upload Roster', href: '/upload' },
  { name: 'Lessons', href: '/lessons' },
  { name: 'Compose', href: '/compose' },
  { name: 'Batches', href: '/batches' },
  { name: 'Settings', href: '/settings' },
]

interface NavigationProps {
  user: {
    email?: string
    role?: string
  }
  showEmergency?: boolean
}

export default function Navigation({ user, showEmergency = false }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleEmergencyAlert = () => {
    router.push('/compose?emergency=true')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/the-wellness-clinic-at-lifequest.png"
                alt="LifeQuest"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>

            <div className="hidden md:flex space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-lifequest-orange text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {showEmergency && (
              <button
                onClick={handleEmergencyAlert}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                🚨 Emergency Alert
              </button>
            )}

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-lifequest-orange text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

