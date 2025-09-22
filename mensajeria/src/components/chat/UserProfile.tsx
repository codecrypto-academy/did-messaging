'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Settings, User } from 'lucide-react'
import { useState } from 'react'
import ProfileModal from './ProfileModal'

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
  }

  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'Usuario')}&background=random`
  }

  const getUserName = () => {
    return user?.user_metadata?.full_name || 
           user?.user_metadata?.username || 
           user?.email?.split('@')[0] || 
           'Usuario'
  }

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <img
              src={getUserAvatar()}
              alt={getUserName()}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {getUserName()}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileModal(true)
                    setShowDropdown(false)
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  <span>Editar Perfil</span>
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  )
}
