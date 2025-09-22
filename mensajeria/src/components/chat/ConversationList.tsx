'use client'

import { Conversation } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  currentUserId?: string
}

export default function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation,
  currentUserId
}: ConversationListProps) {
  const getConversationName = (conversation: Conversation) => {
    console.log('Getting name for conversation:', {
      id: conversation.id,
      name: conversation.name,
      is_group: conversation.is_group,
      participants: conversation.conversation_participants,
      currentUserId
    })
    
    if (conversation.name) {
      return conversation.name
    }
    
    // For private conversations, show the other participant's name
    if (!conversation.is_group && conversation.conversation_participants) {
      const otherParticipant = conversation.conversation_participants.find(
        participant => participant.user_id !== currentUserId
      )
      console.log('Other participant found:', otherParticipant)
      if (otherParticipant?.profiles) {
        const name = otherParticipant.profiles.full_name || otherParticipant.profiles.username || 'Usuario'
        console.log('Using participant name:', name)
        return name
      }
    }
    
    // Fallback to creator's name or default
    const fallbackName = conversation.profiles?.full_name || conversation.profiles?.username || 'Conversación'
    console.log('Using fallback name:', fallbackName)
    return fallbackName
  }

  const getConversationAvatar = (conversation: Conversation) => {
    // For private conversations, use the other participant's avatar
    if (!conversation.is_group && conversation.conversation_participants) {
      const otherParticipant = conversation.conversation_participants.find(
        participant => participant.user_id !== currentUserId
      )
      if (otherParticipant?.profiles?.avatar_url) {
        return otherParticipant.profiles.avatar_url
      }
    }
    
    // Fallback to creator's avatar or generated avatar
    if (conversation.profiles?.avatar_url) {
      return conversation.profiles.avatar_url
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getConversationName(conversation))}&background=random`
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No hay conversaciones</p>
          <p className="text-sm">Crea una nueva conversación para comenzar</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedConversation?.id === conversation.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={getConversationAvatar(conversation)}
                    alt={getConversationName(conversation)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {getConversationName(conversation)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.updated_at), {
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.is_group ? 'Grupo' : 'Conversación privada'}
                    </p>
                    {conversation.is_group && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Grupo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
