
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"description": string | null,"display_order": number,"id": string,"is_active": boolean,"name": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"menu_items": {
                  Row: {
                    "category_id": string,"created_at": string,"description": string | null,"id": string,"image_url": string | null,"is_available": boolean,"name": string,"preparation_time_minutes": number | null,"price": number,"updated_at": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_available"?: boolean,"name": string,"preparation_time_minutes"?: number | null,"price": number,"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_available"?: boolean,"name"?: string,"preparation_time_minutes"?: number | null,"price"?: number,"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_items_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"is_read": boolean,"message": string,"order_id": string | null,"title": string,"type": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_read"?: boolean,"message": string,"order_id"?: string | null,"title": string,"type": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_read"?: boolean,"message"?: string,"order_id"?: string | null,"title"?: string,"type"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "created_at": string,"id": string,"item_name": string,"menu_item_id": string | null,"order_id": string,"quantity": number,"special_instructions": string | null,"subtotal": number,"unit_price": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"item_name": string,"menu_item_id"?: string | null,"order_id": string,"quantity"?: number,"special_instructions"?: string | null,"subtotal": number,"unit_price": number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"item_name"?: string,"menu_item_id"?: string | null,"order_id"?: string,"quantity"?: number,"special_instructions"?: string | null,"subtotal"?: number,"unit_price"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_menu_item_id_fkey"
      columns: ["menu_item_id"]
isOneToOne: false
      referencedRelation: "menu_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "accepted_at": string | null,"cancellation_reason": string | null,"contact_phone": string,"created_at": string,"customer_id": string | null,"delivery_address": string,"delivery_city": string,"delivery_city_area": string,"delivery_fee": number,"delivery_landmark": string | null,"delivery_state": string,"id": string,"notes": string | null,"payment_confirmed_at": string | null,"payment_deadline_at": string | null,"payment_receipt_url": string | null,"payment_uploaded_at": string | null,"rejection_reason": string | null,"status": string,"subtotal": number,"total_amount": number,"updated_at": string,"vendor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"cancellation_reason"?: string | null,"contact_phone": string,"created_at"?: string,"customer_id"?: string | null,"delivery_address": string,"delivery_city"?: string,"delivery_city_area": string,"delivery_fee"?: number,"delivery_landmark"?: string | null,"delivery_state"?: string,"id"?: string,"notes"?: string | null,"payment_confirmed_at"?: string | null,"payment_deadline_at"?: string | null,"payment_receipt_url"?: string | null,"payment_uploaded_at"?: string | null,"rejection_reason"?: string | null,"status"?: string,"subtotal": number,"total_amount": number,"updated_at"?: string,"vendor_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"cancellation_reason"?: string | null,"contact_phone"?: string,"created_at"?: string,"customer_id"?: string | null,"delivery_address"?: string,"delivery_city"?: string,"delivery_city_area"?: string,"delivery_fee"?: number,"delivery_landmark"?: string | null,"delivery_state"?: string,"id"?: string,"notes"?: string | null,"payment_confirmed_at"?: string | null,"payment_deadline_at"?: string | null,"payment_receipt_url"?: string | null,"payment_uploaded_at"?: string | null,"rejection_reason"?: string | null,"status"?: string,"subtotal"?: number,"total_amount"?: number,"updated_at"?: string,"vendor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"key": string,"updated_at": string,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"key": string,"updated_at"?: string,"value": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"key"?: string,"updated_at"?: string,"value"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string,"phone": string | null,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"phone"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"vendors": {
                  Row: {
                    "account_name": string | null,"account_number": string | null,"address": string,"bank_name": string | null,"banner_url": string | null,"business_name": string,"city": string,"city_area": string,"closing_time": string,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"is_open": boolean,"is_phone_public": boolean,"landmark": string | null,"logo_url": string | null,"opening_days": (string)[],"opening_time": string,"phone": string,"slug": string,"state": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_name"?: string | null,"account_number"?: string | null,"address": string,"bank_name"?: string | null,"banner_url"?: string | null,"business_name": string,"city"?: string,"city_area": string,"closing_time"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_open"?: boolean,"is_phone_public"?: boolean,"landmark"?: string | null,"logo_url"?: string | null,"opening_days"?: (string)[],"opening_time"?: string,"phone": string,"slug": string,"state"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "account_name"?: string | null,"account_number"?: string | null,"address"?: string,"bank_name"?: string | null,"banner_url"?: string | null,"business_name"?: string,"city"?: string,"city_area"?: string,"closing_time"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_open"?: boolean,"is_phone_public"?: boolean,"landmark"?: string | null,"logo_url"?: string | null,"opening_days"?: (string)[],"opening_time"?: string,"phone"?: string,"slug"?: string,"state"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"states": {
                  Row: {
                    "created_at": string,"display_order": number,"id": string,"is_active": boolean,"name": string,"code": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name": string,"code": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"code"?: string,"updated_at"?: string
                  }
                  Relationships: []
                },"cities": {
                  Row: {
                    "created_at": string,"display_order": number,"id": string,"is_active": boolean,"name": string,"state_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name": string,"state_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_order"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"state_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
                      foreignKeyName: "cities_state_id_fkey"
                      columns: ["state_id"]
                      isOneToOne: false
                      referencedRelation: "states"
                      referencedColumns: ["id"]
                    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "cancel_expired_orders":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

export type UserRole = "admin" | "vendor" | "customer";

export type OrderStatus =
  | "pending_acceptance"
  | "rejected"
  | "awaiting_payment"
  | "payment_uploaded"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

