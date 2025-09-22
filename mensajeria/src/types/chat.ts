export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  name: string | null
  is_group: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  conversation_participants?: {
    user_id: string
    profiles?: Profile
  }[]
}

export interface Message {
  id: string
  conversation_id: string | null
  sender_id: string | null
  content: string
  message_type: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface ConversationParticipant {
  id: string
  conversation_id: string | null
  user_id: string | null
  joined_at: string
}
