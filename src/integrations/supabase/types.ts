export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      chat_document_links: {
        Row: {
          chat_session_id: string;
          created_at: string | null;
          document_id: string;
          first_used_at: string | null;
          last_used_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          chat_session_id: string;
          created_at?: string | null;
          document_id: string;
          first_used_at?: string | null;
          last_used_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          chat_session_id?: string;
          created_at?: string | null;
          document_id?: string;
          first_used_at?: string | null;
          last_used_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_document_links_chat_session_id_fkey";
            columns: ["chat_session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_document_links_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          content: string | null;
          created_at: string | null;
          document_chunk_ids: string[] | null;
          id: string;
          role: string | null;
          session_id: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          document_chunk_ids?: string[] | null;
          id: string;
          role?: string | null;
          session_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          document_chunk_ids?: string[] | null;
          id?: string;
          role?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string | null;
          id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          chunk_index: number;
          content: string;
          created_at: string | null;
          document_id: string;
          embedding: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          chunk_index: number;
          content: string;
          created_at?: string | null;
          document_id: string;
          embedding?: string | null;
          id: string;
          metadata?: Json | null;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          created_at?: string | null;
          document_id?: string;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          chunks: Json | null;
          content: string | null;
          created_at: string | null;
          file_size: number | null;
          id: string;
          metadata: Json | null;
          original_filename: string;
          processing_status: string | null;
          storage_url: string;
          total_chunks: number | null;
          total_pages: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          chunks?: Json | null;
          content?: string | null;
          created_at?: string | null;
          file_size?: number | null;
          id: string;
          metadata?: Json | null;
          original_filename: string;
          processing_status?: string | null;
          storage_url: string;
          total_chunks?: number | null;
          total_pages?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          chunks?: Json | null;
          content?: string | null;
          created_at?: string | null;
          file_size?: number | null;
          id?: string;
          metadata?: Json | null;
          original_filename?: string;
          processing_status?: string | null;
          storage_url?: string;
          total_chunks?: number | null;
          total_pages?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          initial_role: Database["public"]["Enums"]["organization_member_type"];
          invited_at: string | null;
          invited_by: string | null;
          name: string;
          organization_id: string;
          status: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          initial_role: Database["public"]["Enums"]["organization_member_type"];
          invited_at?: string | null;
          invited_by?: string | null;
          name: string;
          organization_id: string;
          status?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          initial_role?: Database["public"]["Enums"]["organization_member_type"];
          invited_at?: string | null;
          invited_by?: string | null;
          name?: string;
          organization_id?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      members: {
        Row: {
          created_at: string | null;
          default_role: Database["public"]["Enums"]["organization_member_type"];
          email: string;
          id: string;
          invited_by: string | null;
          name: string;
          onboarding_completed: boolean;
          organization_id: string;
          profile_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_role: Database["public"]["Enums"]["organization_member_type"];
          email: string;
          id?: string;
          invited_by?: string | null;
          name: string;
          onboarding_completed?: boolean;
          organization_id: string;
          profile_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_role?: Database["public"]["Enums"]["organization_member_type"];
          email?: string;
          id?: string;
          invited_by?: string | null;
          name?: string;
          onboarding_completed?: boolean;
          organization_id?: string;
          profile_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          name: string;
          onboarding_completed: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          name: string;
          onboarding_completed?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          name?: string;
          onboarding_completed?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "themison_admins";
            referencedColumns: ["id"];
          }
        ];
      };
      patient_documents: {
        Row: {
          created_at: string;
          description: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["patient_document_type_enum"];
          document_url: string;
          file_size: number | null;
          id: string;
          is_latest: boolean | null;
          mime_type: string | null;
          patient_id: string | null;
          status: string | null;
          tags: string[] | null;
          updated_at: string | null;
          uploaded_by: string | null;
          version: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["patient_document_type_enum"];
          document_url: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          patient_id?: string | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          document_name?: string;
          document_type?: Database["public"]["Enums"]["patient_document_type_enum"];
          document_url?: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          patient_id?: string | null;
          status?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          }
        ];
      };
      patient_visits: {
        Row: {
          cost_data: Json | null;
          created_at: string | null;
          created_by: string | null;
          doctor_id: string;
          duration_minutes: number | null;
          id: string;
          location: string | null;
          next_visit_date: string | null;
          notes: string | null;
          patient_id: string;
          status: Database["public"]["Enums"]["visit_status_enum"];
          trial_id: string;
          updated_at: string | null;
          visit_date: string;
          visit_number: number | null;
          visit_time: string | null;
          visit_type: Database["public"]["Enums"]["visit_type_enum"];
        };
        Insert: {
          cost_data?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          doctor_id: string;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          next_visit_date?: string | null;
          notes?: string | null;
          patient_id: string;
          status?: Database["public"]["Enums"]["visit_status_enum"];
          trial_id: string;
          updated_at?: string | null;
          visit_date: string;
          visit_number?: number | null;
          visit_time?: string | null;
          visit_type?: Database["public"]["Enums"]["visit_type_enum"];
        };
        Update: {
          cost_data?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          doctor_id?: string;
          duration_minutes?: number | null;
          id?: string;
          location?: string | null;
          next_visit_date?: string | null;
          notes?: string | null;
          patient_id?: string;
          status?: Database["public"]["Enums"]["visit_status_enum"];
          trial_id?: string;
          updated_at?: string | null;
          visit_date?: string;
          visit_number?: number | null;
          visit_time?: string | null;
          visit_type?: Database["public"]["Enums"]["visit_type_enum"];
        };
        Relationships: [
          {
            foreignKeyName: "patient_enrolled_in_trial";
            columns: ["patient_id", "trial_id"];
            isOneToOne: false;
            referencedRelation: "trial_patients";
            referencedColumns: ["patient_id", "trial_id"];
          },
          {
            foreignKeyName: "patient_visits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      patients: {
        Row: {
          blood_type: string | null;
          city: string | null;
          consent_date: string | null;
          consent_signed: boolean | null;
          country: string | null;
          created_at: string | null;
          current_medications: string | null;
          date_of_birth: string | null;
          email: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          first_name: string | null;
          gender: string | null;
          height_cm: number | null;
          id: string;
          insurance_policy_number: string | null;
          insurance_provider: string | null;
          is_active: boolean | null;
          known_allergies: string | null;
          last_name: string | null;
          medical_history: string | null;
          organization_id: string;
          patient_code: string;
          phone_number: string | null;
          postal_code: string | null;
          primary_physician_name: string | null;
          primary_physician_phone: string | null;
          screening_notes: string | null;
          state_province: string | null;
          street_address: string | null;
          updated_at: string | null;
          weight_kg: number | null;
        };
        Insert: {
          blood_type?: string | null;
          city?: string | null;
          consent_date?: string | null;
          consent_signed?: boolean | null;
          country?: string | null;
          created_at?: string | null;
          current_medications?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          first_name?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          id?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          is_active?: boolean | null;
          known_allergies?: string | null;
          last_name?: string | null;
          medical_history?: string | null;
          organization_id: string;
          patient_code: string;
          phone_number?: string | null;
          postal_code?: string | null;
          primary_physician_name?: string | null;
          primary_physician_phone?: string | null;
          screening_notes?: string | null;
          state_province?: string | null;
          street_address?: string | null;
          updated_at?: string | null;
          weight_kg?: number | null;
        };
        Update: {
          blood_type?: string | null;
          city?: string | null;
          consent_date?: string | null;
          consent_signed?: boolean | null;
          country?: string | null;
          created_at?: string | null;
          current_medications?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relationship?: string | null;
          first_name?: string | null;
          gender?: string | null;
          height_cm?: number | null;
          id?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          is_active?: boolean | null;
          known_allergies?: string | null;
          last_name?: string | null;
          medical_history?: string | null;
          organization_id?: string;
          patient_code?: string;
          phone_number?: string | null;
          postal_code?: string | null;
          primary_physician_name?: string | null;
          primary_physician_phone?: string | null;
          screening_notes?: string | null;
          state_province?: string | null;
          street_address?: string | null;
          updated_at?: string | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          permission_level?: Database["public"]["Enums"]["permission_level"];
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          permission_level?: Database["public"]["Enums"]["permission_level"];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      themison_admins: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          created_by: string | null;
          email: string;
          id: string;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          id?: string;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      trial_documents: {
        Row: {
          amendment_number: number | null;
          created_at: string;
          description: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["document_type_enum"];
          document_url: string;
          file_size: number | null;
          id: string;
          is_latest: boolean | null;
          mime_type: string | null;
          status: string | null;
          tags: string[] | null;
          trial_id: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          version: number | null;
          warning: boolean | null;
        };
        Insert: {
          amendment_number?: number | null;
          created_at?: string;
          description?: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["document_type_enum"];
          document_url: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          trial_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
          warning?: boolean | null;
        };
        Update: {
          amendment_number?: number | null;
          created_at?: string;
          description?: string | null;
          document_name?: string;
          document_type?: Database["public"]["Enums"]["document_type_enum"];
          document_url?: string;
          file_size?: number | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          status?: string | null;
          tags?: string[] | null;
          trial_id?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
          warning?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "trial_documents_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_members: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          member_id: string;
          role_id: string;
          start_date: string | null;
          trial_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          member_id: string;
          role_id: string;
          start_date?: string | null;
          trial_id: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          member_id?: string;
          role_id?: string;
          start_date?: string | null;
          trial_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trial_members_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_members_pending: {
        Row: {
          created_at: string | null;
          id: string;
          invitation_id: string;
          invited_by: string | null;
          notes: string | null;
          role_id: string;
          trial_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          invitation_id: string;
          invited_by?: string | null;
          notes?: string | null;
          role_id: string;
          trial_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          invitation_id?: string;
          invited_by?: string | null;
          notes?: string | null;
          role_id?: string;
          trial_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trial_members_pending_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "invitations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_members_pending_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trial_patients: {
        Row: {
          assigned_by: string | null;
          cost_data: Json | null;
          created_at: string | null;
          enrollment_date: string | null;
          id: string;
          notes: string | null;
          patient_id: string;
          randomization_code: string | null;
          status: string | null;
          trial_id: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_by?: string | null;
          cost_data?: Json | null;
          created_at?: string | null;
          enrollment_date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id: string;
          randomization_code?: string | null;
          status?: string | null;
          trial_id: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          cost_data?: Json | null;
          created_at?: string | null;
          enrollment_date?: string | null;
          id?: string;
          notes?: string | null;
          patient_id?: string;
          randomization_code?: string | null;
          status?: string | null;
          trial_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trial_patients_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_patients_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trial_patients_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
      trials: {
        Row: {
          budget_data: Json | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          estimated_close_out: string | null;
          id: string;
          image_url: string | null;
          location: string;
          name: string;
          organization_id: string;
          phase: string;
          sponsor: string;
          status: string | null;
          study_start: string | null;
          updated_at: string | null;
        };
        Insert: {
          budget_data?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          estimated_close_out?: string | null;
          id?: string;
          image_url?: string | null;
          location: string;
          name: string;
          organization_id: string;
          phase: string;
          sponsor: string;
          status?: string | null;
          study_start?: string | null;
          updated_at?: string | null;
        };
        Update: {
          budget_data?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          estimated_close_out?: string | null;
          id?: string;
          image_url?: string | null;
          location?: string;
          name?: string;
          organization_id?: string;
          phase?: string;
          sponsor?: string;
          status?: string | null;
          study_start?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trials_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          password: string | null;
          role: Database["public"]["Enums"]["userrole"] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id: string;
          password?: string | null;
          role?: Database["public"]["Enums"]["userrole"] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          password?: string | null;
          role?: Database["public"]["Enums"]["userrole"] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      visit_documents: {
        Row: {
          amount: number | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["visit_document_type_enum"];
          document_url: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          is_latest: boolean | null;
          mime_type: string | null;
          tags: string[] | null;
          updated_at: string | null;
          upload_date: string | null;
          uploaded_by: string | null;
          version: number | null;
          visit_id: string;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          document_name: string;
          document_type: Database["public"]["Enums"]["visit_document_type_enum"];
          document_url: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          upload_date?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
          visit_id: string;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          document_name?: string;
          document_type?: Database["public"]["Enums"]["visit_document_type_enum"];
          document_url?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_latest?: boolean | null;
          mime_type?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          upload_date?: string | null;
          uploaded_by?: string | null;
          version?: number | null;
          visit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visit_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visit_documents_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "patient_visits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visit_documents_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "patient_visits_detailed";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      patient_visits_detailed: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          doctor_email: string | null;
          doctor_id: string | null;
          doctor_name: string | null;
          duration_minutes: number | null;
          first_name: string | null;
          id: string | null;
          last_name: string | null;
          location: string | null;
          next_visit_date: string | null;
          notes: string | null;
          patient_code: string | null;
          patient_id: string | null;
          status: Database["public"]["Enums"]["visit_status_enum"] | null;
          trial_id: string | null;
          trial_name: string | null;
          trial_phase: string | null;
          updated_at: string | null;
          visit_date: string | null;
          visit_number: number | null;
          visit_time: string | null;
          visit_type: Database["public"]["Enums"]["visit_type_enum"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "patient_enrolled_in_trial";
            columns: ["patient_id", "trial_id"];
            isOneToOne: false;
            referencedRelation: "trial_patients";
            referencedColumns: ["patient_id", "trial_id"];
          },
          {
            foreignKeyName: "patient_visits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "patient_visits_trial_id_fkey";
            columns: ["trial_id"];
            isOneToOne: false;
            referencedRelation: "trials";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      create_trial_with_members: {
        Args: { trial_data: Json; team_assignments: Json[] };
        Returns: string;
      };
      create_trial_with_members_debug: {
        Args: { trial_data: Json; team_assignments: Json[] };
        Returns: {
          trial_id: string;
          debug_logs: string[];
        }[];
      };
      create_trial_with_members_extended: {
        Args: {
          trial_data: Json;
          confirmed_assignments?: Json[];
          pending_assignments?: Json[];
        };
        Returns: string;
      };
      create_trial_with_mixed_assignments: {
        Args: { trial_data: Json; team_assignments?: Json[] };
        Returns: string;
      };
      debug_trial_creation: {
        Args: {
          org_id: string;
          user_profile_id: string;
          trial_data: Json;
          team_assignments: Json[];
        };
        Returns: {
          trial_id: string;
          debug_logs: string[];
        }[];
      };
      get_organization_roles: {
        Args: { org_id: string; search_term?: string };
        Returns: {
          id: string;
          name: string;
          description: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
        }[];
      };
      get_trial_team: {
        Args: { trial_id_param: string };
        Returns: {
          member_id: string;
          member_name: string;
          member_email: string;
          role_name: string;
          permission_level: Database["public"]["Enums"]["permission_level"];
          is_active: boolean;
          start_date: string;
        }[];
      };
      get_user_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_organization_id_for_trial_members: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_themison_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      mock_calculate_burn_rate: {
        Args: { trial_id: string };
        Returns: number;
      };
      mock_get_available_budget: {
        Args: { trial_id: string };
        Returns: number;
      };
      mock_get_patient_total_cost: {
        Args: { patient_id: string; trial_id: string };
        Returns: number;
      };
      user_belongs_to_organization: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      user_can_access_trial: {
        Args: { trial_id_param: string };
        Returns: boolean;
      };
      user_can_create_trials: {
        Args: { user_profile_id: string };
        Returns: boolean;
      };
      user_organization_status: {
        Args: { user_profile_id: string };
        Returns: {
          organization_id: string;
          organization_name: string;
          default_role: string;
          member_since: string;
        }[];
      };
      user_trial_permission: {
        Args: { user_profile_id: string; trial_id_param: string };
        Returns: Database["public"]["Enums"]["permission_level"];
      };
    };
    Enums: {
      document_type_enum:
        | "protocol"
        | "brochure"
        | "consent_form"
        | "report"
        | "manual"
        | "plan"
        | "amendment"
        | "icf"
        | "case_report_form"
        | "standard_operating_procedure"
        | "other";
      organization_member_type: "admin" | "staff";
      patient_document_type_enum:
        | "medical_record"
        | "lab_result"
        | "imaging"
        | "consent_form"
        | "assessment"
        | "questionnaire"
        | "adverse_event_report"
        | "medication_record"
        | "visit_note"
        | "discharge_summary"
        | "other";
      permission_level: "read" | "edit" | "admin";
      userrole: "ADMIN" | "USER";
      visit_document_type_enum:
        | "visit_note"
        | "lab_results"
        | "blood_test"
        | "vital_signs"
        | "invoice"
        | "billing_statement"
        | "medication_log"
        | "adverse_event_form"
        | "assessment_form"
        | "imaging_report"
        | "procedure_note"
        | "data_export"
        | "consent_form"
        | "insurance_document"
        | "other";
      visit_status_enum:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled";
      visit_type_enum:
        | "screening"
        | "baseline"
        | "follow_up"
        | "treatment"
        | "assessment"
        | "monitoring"
        | "adverse_event"
        | "unscheduled"
        | "study_closeout"
        | "withdrawal";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      document_type_enum: [
        "protocol",
        "brochure",
        "consent_form",
        "report",
        "manual",
        "plan",
        "amendment",
        "icf",
        "case_report_form",
        "standard_operating_procedure",
        "other",
      ],
      organization_member_type: ["admin", "staff"],
      patient_document_type_enum: [
        "medical_record",
        "lab_result",
        "imaging",
        "consent_form",
        "assessment",
        "questionnaire",
        "adverse_event_report",
        "medication_record",
        "visit_note",
        "discharge_summary",
        "other",
      ],
      permission_level: ["read", "edit", "admin"],
      userrole: ["ADMIN", "USER"],
      visit_document_type_enum: [
        "visit_note",
        "lab_results",
        "blood_test",
        "vital_signs",
        "invoice",
        "billing_statement",
        "medication_log",
        "adverse_event_form",
        "assessment_form",
        "imaging_report",
        "procedure_note",
        "data_export",
        "consent_form",
        "insurance_document",
        "other",
      ],
      visit_status_enum: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      visit_type_enum: [
        "screening",
        "baseline",
        "follow_up",
        "treatment",
        "assessment",
        "monitoring",
        "adverse_event",
        "unscheduled",
        "study_closeout",
        "withdrawal",
      ],
    },
  },
} as const;
