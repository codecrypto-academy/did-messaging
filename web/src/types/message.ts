export interface Message {
  id: string
  from_did: string
  to_did: string
  mensaje: string
  encrypted_message?: string
  sender_public_key?: string
  fecha: string
  created_at: string
  updated_at: string
  user_id?: string
  read_at?: string | null
  sender_key_id?: string
  sender_key_name?: string
}

export interface Conversation {
  conversation_id: string
  did1: string
  did2: string
  message_count: number
  last_message_date: string
  user_id?: string
}