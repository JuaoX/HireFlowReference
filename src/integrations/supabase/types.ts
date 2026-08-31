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
      activities: {
        Row: {
          action: string
          actor_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string | null
          entity: string
          entity_id: string
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity: string
          entity_id: string
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string | null
          entity?: string
          entity_id?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          job_id: string
          options: string[] | null
          order_idx: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          job_id: string
          options?: string[] | null
          order_idx?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          job_id?: string
          options?: string[] | null
          order_idx?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_responses: {
        Row: {
          application_id: string
          created_at: string
          id: string
          question_id: string
          response_text: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          question_id: string
          response_text?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          question_id?: string
          response_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "application_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          candidate_id: string
          cover_letter: string | null
          created_at: string | null
          current_stage_id: string | null
          id: string
          job_id: string
          owner_user_id: string | null
          rejection_note: string | null
          rejection_reason: string | null
          state: Database["public"]["Enums"]["application_state"] | null
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id: string
          cover_letter?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          id?: string
          job_id: string
          owner_user_id?: string | null
          rejection_note?: string | null
          rejection_reason?: string | null
          state?: Database["public"]["Enums"]["application_state"] | null
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string
          cover_letter?: string | null
          created_at?: string | null
          current_stage_id?: string | null
          id?: string
          job_id?: string
          owner_user_id?: string | null
          rejection_note?: string | null
          rejection_reason?: string | null
          state?: Database["public"]["Enums"]["application_state"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "job_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          acted_at: string | null
          approver_user_id: string
          comment: string | null
          created_at: string | null
          id: string
          offer_id: string
          state: Database["public"]["Enums"]["approval_state"] | null
        }
        Insert: {
          acted_at?: string | null
          approver_user_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          offer_id: string
          state?: Database["public"]["Enums"]["approval_state"] | null
        }
        Update: {
          acted_at?: string | null
          approver_user_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          offer_id?: string
          state?: Database["public"]["Enums"]["approval_state"] | null
        }
        Relationships: [
          {
            foreignKeyName: "approvals_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_url: string
          id: string
          mime_type: string | null
          org_id: string
          owner_id: string
          owner_type: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_url: string
          id?: string
          mime_type?: string | null
          org_id: string
          owner_id: string
          owner_type: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          org_id?: string
          owner_id?: string
          owner_type?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_comments: {
        Row: {
          application_id: string | null
          candidate_id: string
          content: string
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          candidate_id: string
          content: string
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string
          content?: string
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_comments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_comments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_ratings: {
        Row: {
          candidate_id: string
          created_at: string
          culture_fit: number
          experience: number
          hard_skills: number
          id: string
          notes: string | null
          org_id: string
          salary_match: number
          soft_skills: number
          updated_at: string
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          culture_fit: number
          experience: number
          hard_skills: number
          id?: string
          notes?: string | null
          org_id: string
          salary_match: number
          soft_skills: number
          updated_at?: string
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          culture_fit?: number
          experience?: number
          hard_skills?: number
          id?: string
          notes?: string | null
          org_id?: string
          salary_match?: number
          soft_skills?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_ratings_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          avatar_url: string | null
          consent: boolean | null
          consent_at: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          location: string | null
          org_id: string
          parsed_resume_json: Json | null
          phone: string | null
          source: Database["public"]["Enums"]["source_type"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          consent?: boolean | null
          consent_at?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          location?: string | null
          org_id: string
          parsed_resume_json?: Json | null
          phone?: string | null
          source: Database["public"]["Enums"]["source_type"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          consent?: boolean | null
          consent_at?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          location?: string | null
          org_id?: string
          parsed_resume_json?: Json | null
          phone?: string | null
          source?: Database["public"]["Enums"]["source_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string | null
          created_by: string | null
          end_at: string
          ics_file_url: string | null
          id: string
          location: string | null
          meeting_link: string | null
          panel_user_ids: string[] | null
          stage_id: string | null
          start_at: string
          status: Database["public"]["Enums"]["interview_status"] | null
          timezone: string | null
          title: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          created_by?: string | null
          end_at: string
          ics_file_url?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          panel_user_ids?: string[] | null
          stage_id?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["interview_status"] | null
          timezone?: string | null
          title: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          created_by?: string | null
          end_at?: string
          ics_file_url?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          panel_user_ids?: string[] | null
          stage_id?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["interview_status"] | null
          timezone?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "job_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      job_acl: {
        Row: {
          can_message: boolean | null
          can_move_pipeline: boolean | null
          can_view: boolean | null
          can_view_offer: boolean | null
          created_at: string | null
          id: string
          job_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_message?: boolean | null
          can_move_pipeline?: boolean | null
          can_view?: boolean | null
          can_view_offer?: boolean | null
          created_at?: string | null
          id?: string
          job_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_message?: boolean | null
          can_move_pipeline?: boolean | null
          can_view?: boolean | null
          can_view_offer?: boolean | null
          created_at?: string | null
          id?: string
          job_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_acl_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_acl_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_approvals: {
        Row: {
          acted_at: string | null
          approver_user_id: string
          comment: string | null
          created_at: string | null
          id: string
          job_id: string
          state: Database["public"]["Enums"]["approval_state"] | null
        }
        Insert: {
          acted_at?: string | null
          approver_user_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          state?: Database["public"]["Enums"]["approval_state"] | null
        }
        Update: {
          acted_at?: string | null
          approver_user_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          state?: Database["public"]["Enums"]["approval_state"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_approvals_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_stages: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          name: string
          order_idx: number
          type: Database["public"]["Enums"]["stage_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          name: string
          order_idx: number
          type: Database["public"]["Enums"]["stage_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          name?: string
          order_idx?: number
          type?: Database["public"]["Enums"]["stage_type"]
        }
        Relationships: [
          {
            foreignKeyName: "job_stages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          about_us: string | null
          benefits: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          description_md: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id: string | null
          id: string
          location: string | null
          nice_to_have: string | null
          openings: number | null
          org_id: string
          required_skills: string[] | null
          requirements_md: string | null
          role_overview: string | null
          salary_range: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string | null
          what_you_will_do: string | null
        }
        Insert: {
          about_us?: string | null
          benefits?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description_md?: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          nice_to_have?: string | null
          openings?: number | null
          org_id: string
          required_skills?: string[] | null
          requirements_md?: string | null
          role_overview?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string | null
          what_you_will_do?: string | null
        }
        Update: {
          about_us?: string | null
          benefits?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description_md?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          hiring_manager_id?: string | null
          id?: string
          location?: string | null
          nice_to_have?: string | null
          openings?: number | null
          org_id?: string
          required_skills?: string[] | null
          requirements_md?: string | null
          role_overview?: string | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string | null
          what_you_will_do?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_manager_id_fkey"
            columns: ["hiring_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body_html: string
          created_at: string | null
          id: string
          name: string
          org_id: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_html: string
          created_at?: string | null
          id?: string
          name: string
          org_id: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string | null
          body_html: string
          candidate_id: string | null
          cc_addresses: string[] | null
          created_at: string | null
          external_id: string | null
          failed_reason: string | null
          id: string
          org_id: string
          sender_user_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          subject: string
          to_addresses: string[]
        }
        Insert: {
          application_id?: string | null
          body_html: string
          candidate_id?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          org_id: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject: string
          to_addresses: string[]
        }
        Update: {
          application_id?: string | null
          body_html?: string
          candidate_id?: string | null
          cc_addresses?: string[] | null
          created_at?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          org_id?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          subject?: string
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          org_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          org_id: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          org_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          application_id: string
          base_amount: number
          benefits_md: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          equity: string | null
          expires_at: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          state: Database["public"]["Enums"]["offer_state"] | null
          updated_at: string | null
          variable_amount: number | null
        }
        Insert: {
          application_id: string
          base_amount: number
          benefits_md?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          equity?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          state?: Database["public"]["Enums"]["offer_state"] | null
          updated_at?: string | null
          variable_amount?: number | null
        }
        Update: {
          application_id?: string
          base_amount?: number
          benefits_md?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          equity?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          state?: Database["public"]["Enums"]["offer_state"] | null
          updated_at?: string | null
          variable_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          branding_json: Json | null
          created_at: string | null
          id: string
          name: string
          settings_json: Json | null
          slug: string
        }
        Insert: {
          branding_json?: Json | null
          created_at?: string | null
          id?: string
          name: string
          settings_json?: Json | null
          slug: string
        }
        Update: {
          branding_json?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          settings_json?: Json | null
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          org_id: string
          status: Database["public"]["Enums"]["user_status"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          org_id: string
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          org_id?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecards: {
        Row: {
          created_at: string | null
          id: string
          interview_id: string
          notes: string | null
          ratings_json: Json
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interview_id: string
          notes?: string | null
          ratings_json?: Json
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interview_id?: string
          notes?: string | null
          ratings_json?: Json
          recommendation?: Database["public"]["Enums"]["recommendation_type"]
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorecards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          candidate_id: string
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          label: string | null
          org_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          label?: string | null
          org_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          label?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      can_access_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      can_insert_application: { Args: { _job_id: string }; Returns: boolean }
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "basic" | "job_admin" | "site_admin"
      application_state: "active" | "rejected" | "withdrawn" | "hired"
      approval_state: "pending" | "approved" | "rejected"
      employment_type: "full_time" | "part_time" | "contract" | "internship"
      interview_status: "scheduled" | "completed" | "cancelled" | "no_show"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      job_status:
        | "open"
        | "paused"
        | "closed"
        | "draft"
        | "pending_approval"
        | "filled"
      message_status: "queued" | "sent" | "failed"
      offer_state:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "accepted"
        | "declined"
        | "expired"
      recommendation_type: "advance" | "hold" | "no"
      source_type:
        | "careers_site"
        | "referral"
        | "linkedin"
        | "agency"
        | "job_fair"
        | "manual"
      stage_type:
        | "applied"
        | "screen"
        | "phone"
        | "onsite"
        | "offer"
        | "hired"
        | "rejected"
      task_status: "pending" | "completed"
      user_status: "active" | "inactive"
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
      app_role: ["basic", "job_admin", "site_admin"],
      application_state: ["active", "rejected", "withdrawn", "hired"],
      approval_state: ["pending", "approved", "rejected"],
      employment_type: ["full_time", "part_time", "contract", "internship"],
      interview_status: ["scheduled", "completed", "cancelled", "no_show"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      job_status: [
        "open",
        "paused",
        "closed",
        "draft",
        "pending_approval",
        "filled",
      ],
      message_status: ["queued", "sent", "failed"],
      offer_state: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "accepted",
        "declined",
        "expired",
      ],
      recommendation_type: ["advance", "hold", "no"],
      source_type: [
        "careers_site",
        "referral",
        "linkedin",
        "agency",
        "job_fair",
        "manual",
      ],
      stage_type: [
        "applied",
        "screen",
        "phone",
        "onsite",
        "offer",
        "hired",
        "rejected",
      ],
      task_status: ["pending", "completed"],
      user_status: ["active", "inactive"],
    },
  },
} as const
