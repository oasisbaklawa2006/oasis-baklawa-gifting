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
      website_catalog_products: {
        Row: {
          category_cue: string | null
          commerce_verified: boolean
          created_at: string
          currency: string
          display_name: string
          id: string
          media: Json
          provenance: Json
          provider: string
          published: boolean
          sku: string | null
          slug: string
          source_name: string | null
          source_product_id: string
          source_updated_at: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          category_cue?: string | null
          commerce_verified?: boolean
          created_at?: string
          currency?: string
          display_name: string
          id?: string
          media?: Json
          provenance?: Json
          provider?: string
          published?: boolean
          sku?: string | null
          slug: string
          source_name?: string | null
          source_product_id: string
          source_updated_at?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          category_cue?: string | null
          commerce_verified?: boolean
          created_at?: string
          currency?: string
          display_name?: string
          id?: string
          media?: Json
          provenance?: Json
          provider?: string
          published?: boolean
          sku?: string | null
          slug?: string
          source_name?: string | null
          source_product_id?: string
          source_updated_at?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      website_catalog_sync_runs: {
        Row: {
          created_at: string
          errors: Json
          finished_at: string | null
          id: string
          mode: string
          note: string | null
          products_upserted: number
          provider: string
          rejected: number
          started_at: string
          status: string
          variants_upserted: number
        }
        Insert: {
          created_at?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          mode?: string
          note?: string | null
          products_upserted?: number
          provider: string
          rejected?: number
          started_at?: string
          status?: string
          variants_upserted?: number
        }
        Update: {
          created_at?: string
          errors?: Json
          finished_at?: string | null
          id?: string
          mode?: string
          note?: string | null
          products_upserted?: number
          provider?: string
          rejected?: number
          started_at?: string
          status?: string
          variants_upserted?: number
        }
        Relationships: []
      }
      website_catalog_variants: {
        Row: {
          commerce_eligible: boolean
          created_at: string
          currency: string
          current_price: number
          id: string
          option_kind: string
          option_label: string | null
          position: number
          product_id: string
          published: boolean
          regular_price: number | null
          sku: string | null
          source_updated_at: string | null
          source_variant_id: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          commerce_eligible?: boolean
          created_at?: string
          currency?: string
          current_price: number
          id?: string
          option_kind?: string
          option_label?: string | null
          position?: number
          product_id: string
          published?: boolean
          regular_price?: number | null
          sku?: string | null
          source_updated_at?: string | null
          source_variant_id: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          commerce_eligible?: boolean
          created_at?: string
          currency?: string
          current_price?: number
          id?: string
          option_kind?: string
          option_label?: string | null
          position?: number
          product_id?: string
          published?: boolean
          regular_price?: number | null
          sku?: string | null
          source_updated_at?: string | null
          source_variant_id?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_catalog_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "website_catalog_products"
            referencedColumns: ["id"]
          },
        ]
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
