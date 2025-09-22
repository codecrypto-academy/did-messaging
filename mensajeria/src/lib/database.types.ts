export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string | null
          user_id: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          user_id?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          user_id?: string | null
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          sender_id: string | null
          content: string
          message_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content: string
          message_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string | null
          sender_id?: string | null
          content?: string
          message_type?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}