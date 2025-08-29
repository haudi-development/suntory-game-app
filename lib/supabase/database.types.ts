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
          user_id: string
          nickname: string | null
          selected_character: string | null
          total_points: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname?: string | null
          selected_character?: string | null
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string | null
          selected_character?: string | null
          total_points?: number
          created_at?: string
        }
      }
      user_characters: {
        Row: {
          id: string
          user_id: string
          character_type: string
          level: number
          exp: number
          evolution_stage: number
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_type: string
          level?: number
          exp?: number
          evolution_stage?: number
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_type?: string
          level?: number
          exp?: number
          evolution_stage?: number
          unlocked_at?: string
        }
      }
      consumptions: {
        Row: {
          id: string
          user_id: string
          venue_id: string | null
          brand_name: string
          product_type: string
          volume_ml: number
          quantity: number
          points_earned: number
          image_url: string | null
          ai_analysis: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          venue_id?: string | null
          brand_name: string
          product_type: string
          volume_ml: number
          quantity?: number
          points_earned: number
          image_url?: string | null
          ai_analysis?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          venue_id?: string | null
          brand_name?: string
          product_type?: string
          volume_ml?: number
          quantity?: number
          points_earned?: number
          image_url?: string | null
          ai_analysis?: Json | null
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          qr_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          qr_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          qr_code?: string | null
          created_at?: string
        }
      }
      leaderboard_cache: {
        Row: {
          id: string
          scope: string
          scope_id: string | null
          period: string
          rankings: Json
          updated_at: string
        }
        Insert: {
          id?: string
          scope: string
          scope_id?: string | null
          period: string
          rankings: Json
          updated_at?: string
        }
        Update: {
          id?: string
          scope?: string
          scope_id?: string | null
          period?: string
          rankings?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_ranking: {
        Args: {
          user_id: string
          scope: string
          period: string
        }
        Returns: Json
      }
      record_consumption: {
        Args: {
          user_id: string
          venue_id: string
          consumption_data: Json
        }
        Returns: void
      }
      update_character_exp: {
        Args: {
          user_id: string
          character_type: string
          exp_gained: number
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}