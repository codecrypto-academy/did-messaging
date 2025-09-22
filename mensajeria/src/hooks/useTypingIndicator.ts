'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface TypingUser {
  user_id: string
  username: string
  is_typing: boolean
}

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!conversationId || !user) return

    console.log('Setting up typing indicator for conversation:', conversationId)

    // Subscribe to typing events using broadcast instead of presence
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (payload) => {
          console.log('Received typing event:', payload)
          const { user_id, username, is_typing } = payload.payload
          
          if (user_id !== user.id) {
            setTypingUsers(prev => {
              const filtered = prev.filter(u => u.user_id !== user_id)
              if (is_typing) {
                return [...filtered, { user_id, username, is_typing }]
              }
              return filtered
            })
          }
        }
      )
      .subscribe(async (status) => {
        console.log('Typing channel status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to typing channel')
        }
      })

    return () => {
      console.log('Cleaning up typing indicator')
      supabase.removeChannel(channel)
    }
  }, [conversationId, user])

  const startTyping = async () => {
    if (!conversationId || !user || isTyping) return

    console.log('Starting typing indicator')
    setIsTyping(true)
    
    // Get username from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single()
    
    const username = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Usuario'

    await supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username,
          is_typing: true
        }
      })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(async () => {
      await stopTyping()
    }, 3000)
  }

  const stopTyping = async () => {
    if (!conversationId || !user || !isTyping) return

    console.log('Stopping typing indicator')
    setIsTyping(false)
    
    // Get username from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single()
    
    const username = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Usuario'

    await supabase
      .channel(`typing:${conversationId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          username,
          is_typing: false
        }
      })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const handleTyping = () => {
    startTyping()
  }

  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    stopTyping()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    typingUsers,
    isTyping,
    handleTyping,
    handleStopTyping
  }
}
