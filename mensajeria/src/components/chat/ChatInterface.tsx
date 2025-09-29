'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)
import ConversationList from './ConversationList'
import MessageArea from './MessageArea'
import UserProfile from './UserProfile'
import NewConversationModal from './NewConversationModal'
import ProfileDialog from './ProfileDialog'
import DatabaseError from './DatabaseError'
import DebugAuth from '../DebugAuth'
import { Message, Conversation, Profile } from '@/types/chat'
import { useMessageEncryption } from '@/hooks/useMessageEncryption'

export default function ChatInterface() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [databaseError, setDatabaseError] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  
  // Message encryption hook
  const { 
    sendEncryptedMessage, 
    decryptMessageContent, 
    hasKeyAgreementKeys, 
    isEncrypting, 
    isDecrypting 
  } = useMessageEncryption()


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
          return 'error'
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
    console.log('🔄 Loading messages for conversation:', conversationId)
    console.log('👤 Current user:', {
      id: user?.id,
      email: user?.email,
      isAuthenticated: !!user
    })
    
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

      console.log('📨 Messages loaded from database:', data?.length || 0)

      // Decrypt messages if user has keyAgreement keys
      if (user && data) {
        console.log('Loading messages for user:', {
          userId: user.id,
          userEmail: user.email,
          hasUserId: !!user.id,
          userCreatedAt: user.created_at
        })
        
        // Verify user is properly authenticated
        if (!user.id) {
          console.error('User ID is missing - user not properly authenticated')
          setMessages(data || [])
          return
        }
        
        const hasKeys = await hasKeyAgreementKeys(user.id)
        console.log('🔑 User has keys for message loading:', hasKeys)
        
        if (!hasKeys) {
          console.warn('⚠️ User does not have keyAgreement keys - messages will not be decrypted')
          console.log('User details:', {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          })
        }
        
        if (hasKeys) {
          console.log('User has keys, attempting to decrypt messages...')
          const decryptedMessages = await Promise.all(
            data.map(async (message) => {
              try {
                console.log('Decrypting message:', {
                  messageId: message.id,
                  senderId: message.sender_id,
                  currentUserId: user.id,
                  hasEncryptedContent: !!message.encrypted_content,
                  originalContent: message.content
                })
                const decryptedContent = await decryptMessageContent(message, user.id)
                console.log('Decryption result:', {
                  messageId: message.id,
                  originalContent: message.content,
                  decryptedContent: decryptedContent
                })
                return {
                  ...message,
                  content: decryptedContent
                }
              } catch (error) {
                console.error('Error decrypting message:', error)
                return message
              }
            })
          )
          console.log('All messages decrypted:', decryptedMessages)
          setMessages(decryptedMessages)
        } else {
          console.log('User has no keys, showing original messages')
          setMessages(data)
        }
      } else {
        setMessages(data || [])
      }
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
        async (payload) => {
          console.log('New message received via subscription:', payload)
          const newMessage = payload.new as Message
          
          // Decrypt message if user has keyAgreement keys
          if (user) {
            console.log('Decrypting new message for user:', {
              userId: user.id,
              userEmail: user.email,
              messageId: newMessage.id,
              senderId: newMessage.sender_id
            })
            
            const hasKeys = await hasKeyAgreementKeys(user.id)
            console.log('User has keys for new message:', hasKeys)
            
            if (hasKeys) {
              try {
                const decryptedContent = await decryptMessageContent(newMessage, user.id)
                newMessage.content = decryptedContent
              } catch (error) {
                console.error('Error decrypting new message:', error)
              }
            }
          }
          
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

  const checkExistingPrivateConversation = async (participantId: string): Promise<Conversation | null> => {
    if (!user) return null

    try {
      // Buscar conversaciones privadas existentes entre el usuario actual y el participante
      const { data: existingConversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('is_group', false)
        .eq('conversation_participants.user_id', user.id)

      if (error) {
        console.error('Error checking existing conversations:', error)
        return null
      }

      // Verificar si alguna de estas conversaciones también incluye al participante
      for (const conv of existingConversations || []) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)

        const participantIds = participants?.map(p => p.user_id) || []
        
        // Si la conversación tiene exactamente 2 participantes y uno es el participante buscado
        if (participantIds.length === 2 && participantIds.includes(participantId)) {
          // Obtener los participantes completos para la respuesta
          const { data: fullParticipants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles(*)
            `)
            .eq('conversation_id', conv.id)

          return {
            ...conv,
            conversation_participants: fullParticipants || []
          }
        }
      }

      return null
    } catch (err) {
      console.error('Unexpected error checking existing conversations:', err)
      return null
    }
  }

  const createConversation = async (participantIds: string[], isGroup: boolean = false, groupName?: string): Promise<'created' | 'existing' | 'error'> => {
    if (!user) {
      console.error('No user found when creating conversation')
      return 'error'
    }

    console.log('Creating conversation with:', {
      user_id: user.id,
      participantIds,
      isGroup,
      groupName
    })

    // Para conversaciones privadas, verificar si ya existe una conversación con esa persona
    if (!isGroup && participantIds.length === 1) {
      const existingConversation = await checkExistingPrivateConversation(participantIds[0])
      if (existingConversation) {
        console.log('Conversation already exists with this user:', existingConversation)
        // Seleccionar la conversación existente en lugar de crear una nueva
        setSelectedConversation(existingConversation)
        setShowNewConversation(false)
        return 'existing'
      }
    }

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
        return 'error'
      }
    } else if (profileError) {
      console.error('Error checking profile:', profileError)
      return 'error'
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
      return 'error'
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
      return 'error'
    }

    setShowNewConversation(false)
    loadConversations()
    return 'created'
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
      sender_id: user.id,
      userEmail: user.email,
      userCreatedAt: user.created_at
    })

    try {
      // Verify user is properly authenticated
      if (!user.id) {
        console.error('User ID is missing - user not properly authenticated')
        return
      }
      
      // Check if user has keyAgreement keys
      console.log('Checking keys for user:', {
        userId: user.id,
        userEmail: user.email,
        userCreatedAt: user.created_at
      })
      
      const hasKeys = await hasKeyAgreementKeys(user.id)

      console.log('hasKeys result:', {
        hasKeys,
        userId: user.id
      })
      
      if (hasKeys && selectedConversation.conversation_participants) {
        // Find the recipient (first participant that's not the current user)
        const recipient = selectedConversation.conversation_participants.find(
          p => p.user_id !== user.id
        )
        
        if (recipient) {
          // Send encrypted message
          await sendEncryptedMessage(
            selectedConversation.id,
            user.id,
            recipient.user_id,
            content
          )
          console.log('Encrypted message sent successfully')
          return
        }
      }
      
      // Fallback to unencrypted message
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
    } catch (error) {
      console.error('Error sending message:', error)
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
      {/* Debug Auth Component */}
      <DebugAuth />
      
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <UserProfile onOpenProfileDialog={() => setShowProfileDialog(true)} />
        <div className="p-4 border-b border-gray-200 space-y-2">
          <button
            onClick={() => setShowNewConversation(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Nueva Conversación
          </button>
          <button
            onClick={() => setShowProfileDialog(true)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Configurar DID
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

      {/* Profile Dialog */}
      {showProfileDialog && (
        <ProfileDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          onSuccess={() => {
            console.log('Profile updated successfully')
            // Optionally reload profile data
          }}
        />
      )}
    </div>
  )
}
