export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cart_recovery_sessions: {
        Row: {
          attribution: Json
          cart_id: string
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          last_redeemed_at: string | null
          lines: Json
          redeem_count: number
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          attribution?: Json
          cart_id: string
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          last_redeemed_at?: string | null
          lines: Json
          redeem_count?: number
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          attribution?: Json
          cart_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          last_redeemed_at?: string | null
          lines?: Json
          redeem_count?: number
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_webhook_events: {
        Row: {
          created_at: string
          detail: string | null
          event_id: string
          event_type: string | null
          id: string
          processed_at: string | null
          provider: string
          received_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event_id: string
          event_type?: string | null
          id?: string
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          event_id?: string
          event_type?: string | null
          id?: string
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      website_leads: {
        Row: {
          attribution: Json
          company: string | null
          consent_at: string | null
          created_at: string
          dedupe_key: string
          email: string | null
          full_name: string | null
          id: string
          kind: string
          last_submitted_at: string
          marketing_consent: boolean
          message: string | null
          phone: string | null
          source: string
          submission_count: number
          sync_detail: string | null
          sync_state: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          attribution?: Json
          company?: string | null
          consent_at?: string | null
          created_at?: string
          dedupe_key: string
          email?: string | null
          full_name?: string | null
          id?: string
          kind: string
          last_submitted_at?: string
          marketing_consent?: boolean
          message?: string | null
          phone?: string | null
          source: string
          submission_count?: number
          sync_detail?: string | null
          sync_state?: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          attribution?: Json
          company?: string | null
          consent_at?: string | null
          created_at?: string
          dedupe_key?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kind?: string
          last_submitted_at?: string
          marketing_consent?: boolean
          message?: string | null
          phone?: string | null
          source?: string
          submission_count?: number
          sync_detail?: string | null
          sync_state?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_cart_recovery_sessions: { Args: never; Returns: number }
      purge_stale_persistence: {
        Args: { retain_days?: number }
        Returns: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
