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
          mnemonic: string | null
          did: string | null
          diddocument: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          mnemonic?: string | null
          did?: string | null
          diddocument?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          mnemonic?: string | null
          did?: string | null
          diddocument?: Json | null
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
        content: string | null
        encrypted_content: string | null
        sender_public_key: string | null
        recipient_public_key: string | null
        encryption_algorithm: string | null
        message_type: string
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        conversation_id?: string | null
        sender_id?: string | null
        content?: string | null
        encrypted_content?: string | null
        sender_public_key?: string | null
        recipient_public_key?: string | null
        encryption_algorithm?: string | null
        message_type?: string
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        conversation_id?: string | null
        sender_id?: string | null
        content?: string | null
        encrypted_content?: string | null
        sender_public_key?: string | null
        recipient_public_key?: string | null
        encryption_algorithm?: string | null
        message_type?: string
        created_at?: string
        updated_at?: string
      }
    }
      profile_keys: {
        Row: {
          id: string
          profile_id: string | null
          derived_path: string
          curve_type: string
          key_usage: string
          public_key: string
          private_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          derived_path: string
          curve_type: string
          key_usage: string
          public_key: string
          private_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          derived_path?: string
          curve_type?: string
          key_usage?: string
          public_key?: string
          private_key?: string
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