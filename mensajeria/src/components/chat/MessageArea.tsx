'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, Conversation } from '@/types/chat'
import { useAuth } from '@/contexts/AuthContext'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Send, Smile, Paperclip } from 'lucide-react'

interface MessageAreaProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (content: string) => void
}

export default function MessageArea({ 
  conversation, 
  messages, 
  onSendMessage 
}: MessageAreaProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { typingUsers, handleTyping, handleStopTyping } = useTypingIndicator(conversation.id)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
      handleStopTyping()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    } else if (e.key !== 'Enter') {
      handleTyping()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.trim()) {
      handleTyping()
    } else {
      handleStopTyping()
    }
  }

  const getConversationName = () => {
    if (conversation.name) {
      return conversation.name
    }
    return conversation.profiles?.full_name || conversation.profiles?.username || 'Conversación'
  }

  const getConversationAvatar = () => {
    if (conversation.profiles?.avatar_url) {
      return conversation.profiles.avatar_url
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getConversationName())}&background=random`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <img
            src={getConversationAvatar()}
            alt={getConversationName()}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getConversationName()}
            </h2>
            <p className="text-sm text-gray-500">
              {conversation.is_group ? 'Grupo' : 'En línea'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-4">💬</div>
            <p>No hay mensajes aún</p>
            <p className="text-sm">Envía el primer mensaje para comenzar la conversación</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id
            const senderName = message.profiles?.full_name || message.profiles?.username || 'Usuario'
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwn
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  {!isOwn && (
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {senderName}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {format(new Date(message.created_at), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} está escribiendo...`
                    : `${typingUsers.length} personas están escribiendo...`
                  }
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleStopTyping}
              placeholder="Escribe un mensaje..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
