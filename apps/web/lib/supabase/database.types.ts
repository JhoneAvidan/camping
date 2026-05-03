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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          payload: Json | null
          target_id: string | null
          target_kind: string | null
          trip_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          payload?: Json | null
          target_id?: string | null
          target_kind?: string | null
          trip_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          payload?: Json | null
          target_id?: string | null
          target_kind?: string | null
          trip_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          kind: Database["public"]["Enums"]["item_kind"]
          name: string
          sort_order: number
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          kind: Database["public"]["Enums"]["item_kind"]
          name: string
          sort_order?: number
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          kind?: Database["public"]["Enums"]["item_kind"]
          name?: string
          sort_order?: number
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_trip_fk"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          created_at: string
          description: string | null
          external_ref: string | null
          id: string
          is_active: boolean
          location: unknown
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          is_active?: boolean
          location?: unknown
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          is_active?: boolean
          location?: unknown
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      item_claims: {
        Row: {
          claimed_at: string
          item_id: string
          packed_at: string | null
          profile_id: string
          state: Database["public"]["Enums"]["claim_state"]
        }
        Insert: {
          claimed_at?: string
          item_id: string
          packed_at?: string | null
          profile_id: string
          state?: Database["public"]["Enums"]["claim_state"]
        }
        Update: {
          claimed_at?: string
          item_id?: string
          packed_at?: string | null
          profile_id?: string
          state?: Database["public"]["Enums"]["claim_state"]
        }
        Relationships: [
          {
            foreignKeyName: "item_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["item_kind"]
          name: string
          notes: string | null
          quantity: number
          sort_order: number
          trip_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: Database["public"]["Enums"]["item_kind"]
          name: string
          notes?: string | null
          quantity?: number
          sort_order?: number
          trip_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["item_kind"]
          name?: string
          notes?: string | null
          quantity?: number
          sort_order?: number
          trip_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          platform_role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          locale?: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Relationships: []
      }
      trip_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["trip_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          trip_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["trip_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          trip_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["trip_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_invitations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["trip_role"]
          trip_id: string
        }
        Insert: {
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id: string
        }
        Update: {
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["trip_role"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          destination_id: string | null
          ends_on: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          destination_id?: string | null
          ends_on?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          destination_id?: string | null
          ends_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_trip_role: {
        Args: {
          required: Database["public"]["Enums"]["trip_role"]
          t_id: string
          uid: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { uid: string }; Returns: boolean }
      is_trip_member: { Args: { t_id: string; uid: string }; Returns: boolean }
    }
    Enums: {
      claim_state: "claimed" | "packed"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      item_kind: "gear" | "food" | "task"
      platform_role: "super_admin" | "user"
      trip_role: "owner" | "editor" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      claim_state: ["claimed", "packed"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      item_kind: ["gear", "food", "task"],
      platform_role: ["super_admin", "user"],
      trip_role: ["owner", "editor", "viewer"],
    },
  },
} as const
