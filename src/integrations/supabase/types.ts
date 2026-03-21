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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cod_orders: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          notes: string | null
          order_number: number
          postal_code: string
          province: string
          shipping_cost: number
          shipping_method: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: number
          postal_code: string
          province: string
          shipping_cost?: number
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: number
          postal_code?: string
          province?: string
          shipping_cost?: number
          shipping_method?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_variations: {
        Row: {
          checkout_url: string | null
          color: string | null
          created_at: string | null
          id: string
          price: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          checkout_url?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          price?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          checkout_url?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          price?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_countries: string[] | null
          base_cost: number | null
          category_id: string | null
          checkout_url_default: string | null
          checkout_url_pack_1: string | null
          checkout_url_pack_2: string | null
          checkout_url_pack_3: string | null
          cod_available: boolean | null
          created_at: string | null
          currency: string | null
          featured: boolean | null
          full_description: string | null
          gallery: string[] | null
          id: string
          main_image: string | null
          meta_description: string | null
          meta_title: string | null
          mvp_ads: boolean | null
          name: string
          og_image: string | null
          original_price: number | null
          prepaid_available: boolean | null
          promotional_price: number | null
          shipping_cost: number | null
          shipping_time: string | null
          short_description: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"] | null
          stock: number | null
          subtitle: string | null
          tags: string[] | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          available_countries?: string[] | null
          base_cost?: number | null
          category_id?: string | null
          checkout_url_default?: string | null
          checkout_url_pack_1?: string | null
          checkout_url_pack_2?: string | null
          checkout_url_pack_3?: string | null
          cod_available?: boolean | null
          created_at?: string | null
          currency?: string | null
          featured?: boolean | null
          full_description?: string | null
          gallery?: string[] | null
          id?: string
          main_image?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mvp_ads?: boolean | null
          name: string
          og_image?: string | null
          original_price?: number | null
          prepaid_available?: boolean | null
          promotional_price?: number | null
          shipping_cost?: number | null
          shipping_time?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"] | null
          stock?: number | null
          subtitle?: string | null
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          available_countries?: string[] | null
          base_cost?: number | null
          category_id?: string | null
          checkout_url_default?: string | null
          checkout_url_pack_1?: string | null
          checkout_url_pack_2?: string | null
          checkout_url_pack_3?: string | null
          cod_available?: boolean | null
          created_at?: string | null
          currency?: string | null
          featured?: boolean | null
          full_description?: string | null
          gallery?: string[] | null
          id?: string
          main_image?: string | null
          meta_description?: string | null
          meta_title?: string | null
          mvp_ads?: boolean | null
          name?: string
          og_image?: string | null
          original_price?: number | null
          prepaid_available?: boolean | null
          promotional_price?: number | null
          shipping_cost?: number | null
          shipping_time?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"] | null
          stock?: number | null
          subtitle?: string | null
          tags?: string[] | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      product_status: "draft" | "published"
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
      app_role: ["admin", "editor"],
      product_status: ["draft", "published"],
    },
  },
} as const
