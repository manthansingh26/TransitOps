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
      drivers: {
        Row: {
          contact_number: string
          created_at: string
          id: string
          license_category: string
          license_expiry_date: string
          license_number: string
          name: string
          safety_score: number
          status: Database["public"]["Enums"]["driver_status"]
          user_id: string | null
        }
        Insert: {
          contact_number?: string
          created_at?: string
          id?: string
          license_category?: string
          license_expiry_date: string
          license_number: string
          name: string
          safety_score?: number
          status?: Database["public"]["Enums"]["driver_status"]
          user_id?: string | null
        }
        Update: {
          contact_number?: string
          created_at?: string
          id?: string
          license_category?: string
          license_expiry_date?: string
          license_number?: string
          name?: string
          safety_score?: number
          status?: Database["public"]["Enums"]["driver_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          date: string
          description: string
          id: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          date?: string
          description?: string
          id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string
          date: string
          id: string
          liters: number
          odometer_at_fill: number | null
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          liters: number
          odometer_at_fill?: number | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          liters?: number
          odometer_at_fill?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          closed_at: string | null
          cost: number
          description: string
          id: string
          opened_at: string
          status: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id: string
        }
        Insert: {
          closed_at?: string | null
          cost?: number
          description: string
          id?: string
          opened_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id: string
        }
        Update: {
          closed_at?: string | null
          cost?: number
          description?: string
          id?: string
          opened_at?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      trip_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event: string
          id: string
          note: string
          trip_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event: string
          id?: string
          note?: string
          trip_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event?: string
          id?: string
          note?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_distance_km: number | null
          cancelled_at: string | null
          cargo_weight_kg: number
          completed_at: string | null
          created_at: string
          created_by: string | null
          destination: string
          dispatched_at: string | null
          driver_id: string
          fuel_consumed_liters: number | null
          id: string
          planned_distance_km: number
          revenue: number
          source: string
          status: Database["public"]["Enums"]["trip_status"]
          vehicle_id: string
        }
        Insert: {
          actual_distance_km?: number | null
          cancelled_at?: string | null
          cargo_weight_kg: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          destination: string
          dispatched_at?: string | null
          driver_id: string
          fuel_consumed_liters?: number | null
          id?: string
          planned_distance_km: number
          revenue?: number
          source: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_id: string
        }
        Update: {
          actual_distance_km?: number | null
          cancelled_at?: string | null
          cargo_weight_kg?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          destination?: string
          dispatched_at?: string | null
          driver_id?: string
          fuel_consumed_liters?: number | null
          id?: string
          planned_distance_km?: number
          revenue?: number
          source?: string
          status?: Database["public"]["Enums"]["trip_status"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          acquisition_cost: number
          created_at: string
          id: string
          max_load_capacity_kg: number
          model: string
          odometer: number
          region: string
          registration_number: string
          status: Database["public"]["Enums"]["vehicle_status"]
          type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          max_load_capacity_kg: number
          model: string
          odometer?: number
          region?: string
          registration_number: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          max_load_capacity_kg?: number
          model?: string
          odometer?: number
          region?: string
          registration_number?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_trip: { Args: { _trip_id: string }; Returns: undefined }
      close_maintenance: { Args: { _id: string }; Returns: undefined }
      complete_trip: {
        Args: {
          _actual_distance_km: number
          _final_odometer: number
          _fuel_consumed_liters: number
          _trip_id: string
        }
        Returns: undefined
      }
      create_trip: {
        Args: {
          _cargo_weight_kg: number
          _destination: string
          _driver_id: string
          _planned_distance_km: number
          _revenue?: number
          _source: string
          _vehicle_id: string
        }
        Returns: string
      }
      current_role_of: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      dispatch_trip: { Args: { _trip_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      open_maintenance: {
        Args: { _cost?: number; _description: string; _vehicle_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "fleet_manager"
        | "driver"
        | "safety_officer"
        | "financial_analyst"
      driver_status: "available" | "on_trip" | "off_duty" | "suspended"
      expense_category: "toll" | "fine" | "insurance" | "other"
      maintenance_status: "active" | "closed"
      trip_status: "draft" | "dispatched" | "completed" | "cancelled"
      vehicle_status: "available" | "on_trip" | "in_shop" | "retired"
      vehicle_type: "truck" | "van" | "bike" | "car"
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
      app_role: [
        "fleet_manager",
        "driver",
        "safety_officer",
        "financial_analyst",
      ],
      driver_status: ["available", "on_trip", "off_duty", "suspended"],
      expense_category: ["toll", "fine", "insurance", "other"],
      maintenance_status: ["active", "closed"],
      trip_status: ["draft", "dispatched", "completed", "cancelled"],
      vehicle_status: ["available", "on_trip", "in_shop", "retired"],
      vehicle_type: ["truck", "van", "bike", "car"],
    },
  },
} as const
