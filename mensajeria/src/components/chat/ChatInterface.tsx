'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
import ConversationList from './ConversationList'
import MessageArea from './MessageArea'
import UserProfile from './UserProfile'
import NewConversationModal from './NewConversationModal'
import DatabaseError from './DatabaseError'
import { Message, Conversation, Profile } from '@/types/chat'

export default function ChatInterface() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [databaseError, setDatabaseError] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)


  useEffect(() => {
    if (user) {
      ensureUserProfile()
      loadConversations()
      loadProfiles()
    }
  }, [user])

  const ensureUserProfile = async () => {
    if (!user) return

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('User profile not found, creating one...')
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User'
        })

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError)
      } else {
        console.log('User profile created successfully')
      }
    }
  }

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      
      // Limpiar suscripción anterior si existe
      if (unsubscribeRef.current) {
        console.log('Cleaning up previous subscription')
        unsubscribeRef.current()
      }
      
      // Crear nueva suscripción y guardar función de limpieza
      const unsubscribe = subscribeToMessages(selectedConversation.id)
      unsubscribeRef.current = unsubscribe
    }
    
    // Cleanup al desmontar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    if (!user) return

    try {
      // First get conversations where user is a participant
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('updated_at', { ascending: false })

      if (convError) {
        console.error('Error loading conversations:', convError)
        setLoading(false)
        return
      }

      // Then get all participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles(*)
            `)
            .eq('conversation_id', conv.id)

          return {
            ...conv,
            conversation_participants: participants || []
          }
        })
      )

      const data = conversationsWithParticipants

      console.log('Loaded conversations:', data)
      setConversations(data || [])
    } catch (err) {
      console.error('Unexpected error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (error) {
        console.error('Error loading profiles:', error)
        console.error('Profile error details:', {
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint
        })
        
        if (error?.code === 'PGRST116') {
          console.warn('Profiles table not found. Please run the database setup first.')
          setDatabaseError(true)
        } else if (error?.code === 'PGRST301') {
          console.warn('No profiles found. This is normal for a new installation.')
          // Don't set database error for this case
        }
        return
      }

      setProfiles(data || [])
    } catch (err) {
      console.error('Unexpected error loading profiles:', err)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        if (error?.code === 'PGRST116') {
          console.warn('Messages table not found. Please run the database setup first.')
          setDatabaseError(true)
        }
        return
      }

      setMessages(data || [])
    } catch (err) {
      console.error('Unexpected error loading messages:', err)
    }
  }

  const subscribeToMessages = (conversationId: string) => {
    console.log('Subscribing to messages for conversation:', conversationId)
    
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received via subscription:', payload)
          const newMessage = payload.new as Message
          setMessages(prev => {
            console.log('Adding new message to state:', newMessage)
            return [...prev, newMessage]
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      console.log('Unsubscribing from messages for conversation:', conversationId)
      supabase.removeChannel(channel)
    }
  }

  const createConversation = async (participantIds: string[], isGroup: boolean = false, groupName?: string) => {
    if (!user) {
      console.error('No user found when creating conversation')
      return
    }

    console.log('Creating conversation with:', {
      user_id: user.id,
      participantIds,
      isGroup,
      groupName
    })

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('Profile not found, creating one...')
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User'
        })

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError)
        return
      }
    } else if (profileError) {
      console.error('Error checking profile:', profileError)
      return
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        name: groupName || null,
        is_group: isGroup,
        created_by: user.id,
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      console.error('Error details:', {
        code: convError.code,
        message: convError.message,
        details: convError.details,
        hint: convError.hint
      })
      return
    }

    // Ensure participant profiles exist
    for (const participantId of participantIds) {
      const { data: participantProfile, error: participantProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', participantId)
        .single()

      if (participantProfileError && participantProfileError.code === 'PGRST116') {
        console.log(`Participant profile not found for ${participantId}, skipping...`)
        continue
      }
    }

    // Add participants
    const participants = [
      { conversation_id: conversation.id, user_id: user.id },
      ...participantIds.map(id => ({ conversation_id: conversation.id, user_id: id }))
    ]

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participants)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      return
    }

    setShowNewConversation(false)
    loadConversations()
  }

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !user) {
      console.log('Cannot send message: missing conversation or user', {
        selectedConversation: !!selectedConversation,
        user: !!user
      })
      return
    }

    console.log('Sending message:', {
      content,
      conversation_id: selectedConversation.id,
      sender_id: user.id
    })

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content,
        message_type: 'text'
      })
      .select()

    if (error) {
      console.error('Error sending message:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('Message sent successfully:', data)
    }
  }

  const handleRetryConnection = () => {
    setDatabaseError(false)
    setLoading(true)
    loadConversations()
    loadProfiles()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    )
  }

  if (databaseError) {
    return <DatabaseError onRetry={handleRetryConnection} />
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <UserProfile />
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nueva Conversación
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          currentUserId={user?.id}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessageArea
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={sendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Selecciona una conversación
              </h2>
              <p className="text-gray-500">
                Elige una conversación existente o crea una nueva
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          profiles={profiles}
          onClose={() => setShowNewConversation(false)}
          onCreateConversation={createConversation}
        />
      )}
    </div>
  )
}
