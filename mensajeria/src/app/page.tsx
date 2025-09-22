'use client'

import { useAuth } from '@/contexts/AuthContext'
import AuthPage from '@/components/auth/AuthPage'
import ChatInterface from '@/components/chat/ChatInterface'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return user ? <ChatInterface /> : <AuthPage />
}
