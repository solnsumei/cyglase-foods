export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          slug: string;
          description: string | null;
          phone: string;
          is_phone_public: boolean;
          logo_url: string | null;
          banner_url: string | null;
          state: string;
          city_area: string;
          landmark: string | null;
          address: string;
          opening_time: string;
          closing_time: string;
          opening_days: string[];
          is_open: boolean;
          is_active: boolean;
          bank_name: string | null;
          account_number: string | null;
          account_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          slug: string;
          description?: string | null;
          phone: string;
          is_phone_public?: boolean;
          logo_url?: string | null;
          banner_url?: string | null;
          state?: string;
          city_area: string;
          landmark?: string | null;
          address: string;
          opening_time?: string;
          closing_time?: string;
          opening_days?: string[];
          is_open?: boolean;
          is_active?: boolean;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          slug?: string;
          description?: string | null;
          phone?: string;
          is_phone_public?: boolean;
          logo_url?: string | null;
          banner_url?: string | null;
          state?: string;
          city_area?: string;
          landmark?: string | null;
          address?: string;
          opening_time?: string;
          closing_time?: string;
          opening_days?: string[];
          is_open?: boolean;
          is_active?: boolean;
          bank_name?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          vendor_id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          preparation_time_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          preparation_time_minutes?: number;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          vendor_id: string;
          subtotal: number;
          delivery_fee: number;
          total_amount: number;
          status: OrderStatus;
          accepted_at: string | null;
          payment_deadline_at: string | null;
          payment_receipt_url: string | null;
          payment_uploaded_at: string | null;
          payment_confirmed_at: string | null;
          rejection_reason: string | null;
          cancellation_reason: string | null;
          delivery_state: string;
          delivery_city_area: string;
          delivery_landmark: string | null;
          delivery_address: string;
          contact_phone: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          vendor_id: string;
          subtotal: number;
          delivery_fee?: number;
          total_amount: number;
          status?: OrderStatus;
          accepted_at?: string | null;
          payment_deadline_at?: string | null;
          payment_receipt_url?: string | null;
          payment_uploaded_at?: string | null;
          payment_confirmed_at?: string | null;
          rejection_reason?: string | null;
          cancellation_reason?: string | null;
          delivery_state?: string;
          delivery_city_area: string;
          delivery_landmark?: string | null;
          delivery_address: string;
          contact_phone: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          vendor_id?: string;
          subtotal?: number;
          delivery_fee?: number;
          total_amount?: number;
          status?: OrderStatus;
          accepted_at?: string | null;
          payment_deadline_at?: string | null;
          payment_receipt_url?: string | null;
          payment_uploaded_at?: string | null;
          payment_confirmed_at?: string | null;
          rejection_reason?: string | null;
          cancellation_reason?: string | null;
          delivery_state?: string;
          delivery_city_area?: string;
          delivery_landmark?: string | null;
          delivery_address?: string;
          contact_phone?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name: string;
          unit_price: number;
          quantity: number;
          subtotal: number;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          item_name: string;
          unit_price: number;
          quantity?: number;
          subtotal: number;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          item_name?: string;
          unit_price?: number;
          quantity?: number;
          subtotal?: number;
          special_instructions?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          type: string;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_expired_orders: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
    };
  };
}
