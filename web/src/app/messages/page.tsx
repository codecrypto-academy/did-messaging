'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { didAPI, DID } from '@/lib/did-api'
import { useAuth } from '@/contexts/AuthContext'
import { Message, Conversation } from '@/types/message'
import { useConversationRealtime } from '@/hooks/useConversationRealtime'
import { createConversationChannelId } from '@/lib/realtime-channels'

export default function MessagesPage() {
  const { user } = useAuth()
  const [dids, setDids] = useState<DID[]>([])
  const [selectedDID, setSelectedDID] = useState<DID | null>(null)
  const [targetDID, setTargetDID] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  // Usar el nuevo hook de realtime para conversaciones
  const { 
    isConnected: realtimeConnected, 
    connectionStatus, 
    retryCount, 
    maxRetries, 
    reconnect 
  } = useConversationRealtime({
    did1: selectedDID?.did || '',
    did2: targetDID,
    onNewMessage: (message) => {
      console.log('📨 Nuevo mensaje recibido via hook:', message)
      addMessageOptimized(message)
    },
    onMessageUpdate: (message) => {
      console.log('📝 Mensaje actualizado via hook:', message)
      setMessages(prev => prev.map(msg => msg.id === message.id ? message : msg))
    },
    onMessageDelete: (messageId) => {
      console.log('🗑️ Mensaje eliminado via hook:', messageId)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    }
  })

  const realtimeStatus = connectionStatus

  useEffect(() => {
    loadInitialData()
  }, [user])

  useEffect(() => {
    if (selectedDID && targetDID) {
      loadMessages()
    }
  }, [selectedDID, targetDID])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadInitialData = async () => {
    try {
      setError('')

      // Cargar DIDs del usuario
      const didsResponse = await didAPI.getDIDs()
      setDids(Array.isArray(didsResponse) ? didsResponse : [])

      // Cargar conversaciones existentes
      await loadConversations()

    } catch (error: any) {
      setError(error.message || 'Error al cargar datos')
      setDids([]) // Asegurar que dids sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_date', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error: any) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadMessages = async () => {
    if (!selectedDID || !targetDID) return

    try {
      setError('')
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(from_did.eq.${selectedDID.did},to_did.eq.${targetDID}),and(from_did.eq.${targetDID},to_did.eq.${selectedDID.did})`)
        .order('fecha', { ascending: true })

      if (error) throw error
      setMessages(data || [])
      console.log(`📨 Cargados ${data?.length || 0} mensajes`)
    } catch (error: any) {
      setError(error.message || 'Error al cargar mensajes')
      console.error('❌ Error cargando mensajes:', error)
    }
  }

  // Función optimizada para agregar mensajes sin duplicados
  const addMessageOptimized = (newMessage: Message) => {
    setMessages(prev => {
      // Verificar si el mensaje ya existe
      const exists = prev.some(msg => 
        msg.id === newMessage.id ||
        (msg.from_did === newMessage.from_did &&
         msg.to_did === newMessage.to_did &&
         msg.mensaje === newMessage.mensaje &&
         Math.abs(
           new Date(msg.fecha || msg.created_at).getTime() - 
           new Date(newMessage.fecha || newMessage.created_at).getTime()
         ) < 1000)
      )
      
      if (exists) {
        console.log('⚠️ Mensaje duplicado ignorado:', newMessage.id)
        return prev
      }

      console.log('✅ Nuevo mensaje agregado:', newMessage.id)
      const updated = [...prev, newMessage].sort((a, b) =>
        new Date(a.fecha || a.created_at).getTime() - new Date(b.fecha || b.created_at).getTime()
      )
      
      // Actualizar referencia del último mensaje
      lastMessageIdRef.current = newMessage.id
      
      return updated
    })
  }

  const refreshMessages = async () => {
    console.log('🔄 Refrescando mensajes manualmente...')
    setRefreshing(true)
    try {
      await loadMessages()
    } finally {
      setRefreshing(false)
    }
  }

  const handleReconnect = () => {
    console.log('🔄 Reconectando realtime...')
    reconnect()
  }


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDID || !targetDID || !newMessage.trim() || !user) {
      return
    }

    setSending(true)
    setError('')

    try {
      const messageData = {
        from_did: selectedDID.did,
        to_did: targetDID,
        mensaje: newMessage.trim(),
        encrypted_message: newMessage.trim(), // Por ahora sin cifrado
        sender_public_key: selectedDID.public_key,
        user_id: user.id,
        fecha: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()

      if (error) throw error

      setNewMessage('')
      console.log('✅ Mensaje enviado exitosamente')

      // Actualizar la lista de mensajes inmediatamente (optimistic update)
      if (data && data.length > 0) {
        const sentMessage = data[0] as Message
        addMessageOptimized(sentMessage)
      }

    } catch (error: any) {
      setError(error.message || 'Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="h-screen bg-gray-100 flex flex-col">
        <div className="bg-white border-b p-4">
          <h1 className="text-2xl font-bold text-gray-900">Mensajes DID</h1>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Panel izquierdo - Configuración */}
          <div className="w-80 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900 mb-3">Configurar Chat</h2>

              {/* Seleccionar DID propio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mi DID
                </label>
                <select
                  value={selectedDID?.id || ''}
                  onChange={(e) => {
                    const did = dids.find(d => d.id === e.target.value)
                    setSelectedDID(did || null)
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar DID...</option>
                  {(Array.isArray(dids) ? dids : []).map((did) => (
                    <option key={did.id} value={did.id}>
                      {did.did.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Ingresar DID destino */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DID Destino
                </label>
                <input
                  type="text"
                  value={targetDID}
                  onChange={(e) => setTargetDID(e.target.value)}
                  placeholder="did:example:123..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {selectedDID && targetDID && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="ml-2 text-sm text-green-700">Chat configurado</span>
                  </div>
                </div>
              )}
            </div>

            {/* Conversaciones anteriores */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-medium text-gray-700 mb-2">Conversaciones</h3>
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay conversaciones</p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv, index) => {
                      // Crear key única para evitar duplicados
                      const uniqueConvKey = `${conv.conversation_id || 'conv'}-${conv.did1}-${conv.did2}-${index}`
                      return (
                        <div
                          key={uniqueConvKey}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          // Implementar selección de conversación existente
                          const otherDID = conv.did1 === selectedDID?.did ? conv.did2 : conv.did1
                          setTargetDID(otherDID)
                        }}
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {conv.did1.substring(0, 20)}...
                        </div>
                        <div className="text-sm font-medium text-gray-900 truncate">
                          ↔ {conv.did2.substring(0, 20)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {conv.message_count} mensajes
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(conv.last_message_date)}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho - Chat */}
          <div className="flex-1 flex flex-col">
            {selectedDID && targetDID ? (
              <>
                {/* Header del chat */}
                <div className="bg-white border-b p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Chat entre DIDs</h3>
                      <p className="text-sm text-gray-600">
                        De: {selectedDID.did.substring(0, 40)}...
                      </p>
                      <p className="text-sm text-gray-600">
                        Para: {targetDID.substring(0, 40)}...
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Channel: conversation:{createConversationChannelId(selectedDID.did, targetDID)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {realtimeConnected ? '🟢' : '🔴'} Realtime: {realtimeStatus}
                        {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {messages.length} mensajes
                        </span>
                        {/* Indicador de estado de realtime */}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          realtimeStatus === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : realtimeStatus === 'connecting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : realtimeStatus === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            realtimeStatus === 'connected'
                              ? 'bg-green-500'
                              : realtimeStatus === 'connecting'
                              ? 'bg-yellow-500 animate-pulse'
                              : realtimeStatus === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                          }`}></div>
                          {realtimeStatus === 'connected' && 'En vivo'}
                          {realtimeStatus === 'connecting' && 'Conectando...'}
                          {realtimeStatus === 'error' && `Error (${retryCount}/${maxRetries})`}
                          {realtimeStatus === 'disconnected' && 'Desconectado'}
                        </span>
                        
                        {/* Botones de control */}
                        <div className="flex space-x-1">
                          <button
                            onClick={refreshMessages}
                            disabled={refreshing}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                            title="Refrescar mensajes"
                          >
                            <svg 
                              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                          </button>
                          
                          {(realtimeStatus === 'error' || realtimeStatus === 'disconnected') && (
                            <button
                              onClick={handleReconnect}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Reconectar realtime"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Área de mensajes */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {error && (
                    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {/* Mensaje de estado de conexión */}
                  {realtimeStatus === 'error' && (
                    <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                          </svg>
                          <span className="text-sm font-medium">
                            Problemas de conexión en tiempo real (intento {retryCount}/{maxRetries})
                          </span>
                        </div>
                        <button
                          onClick={handleReconnect}
                          className="text-yellow-700 hover:text-yellow-900 text-sm underline"
                        >
                          Reconectar
                        </button>
                      </div>
                      <p className="text-sm mt-1">
                        Los mensajes se actualizarán manualmente. Usa el botón de refrescar para obtener los últimos mensajes.
                      </p>
                    </div>
                  )}

                  {realtimeStatus === 'connecting' && (
                    <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4">
                      <div className="flex items-center">
                        <svg className="animate-spin w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">
                          Conectando en tiempo real...
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isOwn = message.from_did === selectedDID.did
                      // Crear una key única combinando id, timestamp y index para evitar duplicados
                      const uniqueKey = `${message.id}-${message.fecha || message.created_at}-${index}`
                      return (
                        <div
                          key={uniqueKey}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-900 border'
                            }`}
                          >
                            <div className="break-words">
                              {message.mensaje || message.encrypted_message}
                            </div>
                            <div
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.fecha || message.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input de mensaje */}
                <div className="bg-white border-t p-4">
                  <form onSubmit={sendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      {sending ? (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Configura el chat</h3>
                  <p className="mt-2 text-gray-600 max-w-sm">
                    Selecciona tu DID e ingresa el DID de destino para comenzar a chatear.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}