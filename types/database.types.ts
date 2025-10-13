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
      orgs: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'admin' | 'staff'
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: 'admin' | 'staff'
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: 'admin' | 'staff'
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          org_id: string
          parent_name: string
          child_name: string
          email: string | null
          phone: string | null
          external_client_id: string | null
          sms_opt_out: boolean
          email_opt_out: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          parent_name: string
          child_name: string
          email?: string | null
          phone?: string | null
          external_client_id?: string | null
          sms_opt_out?: boolean
          email_opt_out?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          parent_name?: string
          child_name?: string
          email?: string | null
          phone?: string | null
          external_client_id?: string | null
          sms_opt_out?: boolean
          email_opt_out?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          org_id: string
          name: string
          weekday: string | null
          start_time: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          weekday?: string | null
          start_time?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          weekday?: string | null
          start_time?: string | null
          location?: string | null
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          lesson_id: string
          client_id: string
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          client_id: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          client_id?: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
      }
      message_batches: {
        Row: {
          id: string
          org_id: string
          channel: 'email' | 'sms' | 'both'
          subject: string | null
          body: string
          lesson_id: string | null
          target_date: string | null
          created_by: string
          status: 'pending' | 'sending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          channel: 'email' | 'sms' | 'both'
          subject?: string | null
          body: string
          lesson_id?: string | null
          target_date?: string | null
          created_by: string
          status?: 'pending' | 'sending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          channel?: 'email' | 'sms' | 'both'
          subject?: string | null
          body?: string
          lesson_id?: string | null
          target_date?: string | null
          created_by?: string
          status?: 'pending' | 'sending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      message_outbox: {
        Row: {
          id: string
          batch_id: string
          client_id: string
          dest_email: string | null
          dest_phone: string | null
          channel: 'email' | 'sms'
          status: 'pending' | 'sent' | 'failed'
          provider_message_id: string | null
          last_error: string | null
          sent_at: string | null
          retry_count: number
          send_after: string
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          client_id: string
          dest_email?: string | null
          dest_phone?: string | null
          channel: 'email' | 'sms'
          status?: 'pending' | 'sent' | 'failed'
          provider_message_id?: string | null
          last_error?: string | null
          sent_at?: string | null
          retry_count?: number
          send_after?: string
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          client_id?: string
          dest_email?: string | null
          dest_phone?: string | null
          channel?: 'email' | 'sms'
          status?: 'pending' | 'sent' | 'failed'
          provider_message_id?: string | null
          last_error?: string | null
          sent_at?: string | null
          retry_count?: number
          send_after?: string
          created_at?: string
        }
      }
      import_mappings: {
        Row: {
          id: string
          org_id: string
          mapping_config: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          mapping_config: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          mapping_config?: Json
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          category: 'emergency' | 'schedule_change' | 'marketing'
          subject: string | null
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          category: 'emergency' | 'schedule_change' | 'marketing'
          subject?: string | null
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          category?: 'emergency' | 'schedule_change' | 'marketing'
          subject?: string | null
          body?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

