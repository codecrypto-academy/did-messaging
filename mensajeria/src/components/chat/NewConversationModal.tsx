'use client'

import { useState } from 'react'
import { Profile } from '@/types/chat'
import { X, Users, User, Search } from 'lucide-react'

interface NewConversationModalProps {
  profiles: Profile[]
  onClose: () => void
  onCreateConversation: (participantIds: string[], isGroup: boolean, groupName?: string) => Promise<'created' | 'existing' | 'error'>
}

export default function NewConversationModal({ 
  profiles, 
  onClose, 
  onCreateConversation 
}: NewConversationModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [step, setStep] = useState<'type' | 'participants' | 'group-name'>('type')
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)


  const filteredProfiles = profiles.filter(profile =>
    profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.full_name && profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleParticipantToggle = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) return

    setIsCreating(true)
    setMessage(null)

    try {
      const result = isGroup 
        ? await onCreateConversation(selectedParticipants, true, groupName || undefined)
        : await onCreateConversation(selectedParticipants, false)

      if (result === 'existing') {
        setMessage({
          type: 'info',
          text: 'Ya tienes una conversación con esta persona. Se ha abierto la conversación existente.'
        })
        // Cerrar el modal después de un breve delay para que el usuario vea el mensaje
        setTimeout(() => {
          onClose()
        }, 2000)
      } else if (result === 'created') {
        setMessage({
          type: 'success',
          text: isGroup ? 'Grupo creado exitosamente' : 'Conversación creada exitosamente'
        })
        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage({
          type: 'error',
          text: 'Error al crear la conversación. Por favor, inténtalo de nuevo.'
        })
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      setMessage({
        type: 'error',
        text: 'Error inesperado al crear la conversación.'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    if (step === 'participants') {
      setStep('type')
    } else if (step === 'group-name') {
      setStep('participants')
    }
  }

  const handleNext = () => {
    if (step === 'type') {
      if (isGroup) {
        setStep('participants')
      } else {
        setStep('participants')
      }
    } else if (step === 'participants') {
      if (isGroup) {
        setStep('group-name')
      } else {
        handleCreateConversation()
      }
    } else if (step === 'group-name') {
      handleCreateConversation()
    }
  }

  const canProceed = () => {
    if (isCreating) return false
    if (step === 'type') return true
    if (step === 'participants') return selectedParticipants.length > 0
    if (step === 'group-name') return groupName.trim().length > 0
    return false
  }


  if (!profiles || profiles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nueva Conversación
            </h2>
            <p className="text-gray-600 mb-4">
              No hay otros usuarios disponibles para crear una conversación.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Regístrate con otro usuario en una pestaña diferente para poder chatear.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Nueva Conversación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {step === 'type' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                ¿Qué tipo de conversación quieres crear?
              </h3>
              
              <button
                onClick={() => setIsGroup(false)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  !isGroup
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Conversación Privada</h4>
                    <p className="text-sm text-gray-500">Chatea con una persona</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsGroup(true)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                  isGroup
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Grupo</h4>
                    <p className="text-sm text-gray-500">Chatea con múltiples personas</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === 'participants' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ←
                </button>
                <h3 className="text-sm font-medium text-gray-900">
                  Selecciona participantes
                </h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleParticipantToggle(profile.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedParticipants.includes(profile.id)
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=random`}
                        alt={profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {profile.full_name || profile.username}
                        </h4>
                        <p className="text-sm text-gray-500">@{profile.username}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedParticipants.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Seleccionados: {selectedParticipants.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map((userId) => {
                      const profile = profiles.find(p => p.id === userId)
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {profile?.username}
                          <button
                            onClick={() => handleParticipantToggle(userId)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'group-name' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ←
                </button>
                <h3 className="text-sm font-medium text-gray-900">
                  Nombre del grupo
                </h3>
              </div>

              <input
                type="text"
                placeholder="Nombre del grupo (opcional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="text-sm text-gray-500">
                Si no proporcionas un nombre, se usará la lista de participantes.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {step !== 'type' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Atrás
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isCreating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {isCreating 
                ? 'Creando...' 
                : step === 'group-name' 
                  ? 'Crear Grupo' 
                  : 'Siguiente'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
