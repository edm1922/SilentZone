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
      mute_rules: {
        Row: {
          id: string
          user_id: string
          keywords: string[]
          platforms: Json
          start_time: number
          duration_ms: number
          use_regex: boolean
          case_sensitive: boolean
          match_whole_word: boolean
          created_at: string
          updated_at: string
          platform_settings: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          keywords: string[]
          platforms: Json
          start_time: number
          duration_ms: number
          use_regex?: boolean
          case_sensitive?: boolean
          match_whole_word?: boolean
          created_at?: string
          updated_at?: string
          platform_settings?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          keywords?: string[]
          platforms?: Json
          start_time?: number
          duration_ms?: number
          use_regex?: boolean
          case_sensitive?: boolean
          match_whole_word?: boolean
          created_at?: string
          updated_at?: string
          platform_settings?: Json | null
        }
      }
      filter_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_active: boolean
          is_default: boolean | null
          platform_settings: Json | null
          mute_rules: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_active?: boolean
          is_default?: boolean | null
          platform_settings?: Json | null
          mute_rules?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          is_default?: boolean | null
          platform_settings?: Json | null
          mute_rules?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: string
          notifications_enabled: boolean
          sync_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: string
          notifications_enabled?: boolean
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: string
          notifications_enabled?: boolean
          sync_enabled?: boolean
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
