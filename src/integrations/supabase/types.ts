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
      bookable_blocks: {
        Row: {
          bookable_id: string
          created_at: string
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          bookable_id: string
          created_at?: string
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          bookable_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_blocks_studio_id_fkey"
            columns: ["bookable_id"]
            isOneToOne: false
            referencedRelation: "bookables"
            referencedColumns: ["id"]
          },
        ]
      }
      bookable_equipment: {
        Row: {
          bookable_id: string
          category: string | null
          id: string
          included: boolean
          name: string
          quantity: number | null
          sort_order: number
        }
        Insert: {
          bookable_id: string
          category?: string | null
          id?: string
          included?: boolean
          name: string
          quantity?: number | null
          sort_order?: number
        }
        Update: {
          bookable_id?: string
          category?: string | null
          id?: string
          included?: boolean
          name?: string
          quantity?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_equipment_studio_id_fkey"
            columns: ["bookable_id"]
            isOneToOne: false
            referencedRelation: "bookables"
            referencedColumns: ["id"]
          },
        ]
      }
      bookable_photos: {
        Row: {
          bookable_id: string
          created_at: string
          id: string
          sort_order: number
          subject_id: string
          subject_type: string
          url: string
        }
        Insert: {
          bookable_id: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_id: string
          subject_type: string
          url: string
        }
        Update: {
          bookable_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject_id?: string
          subject_type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_photos_studio_id_fkey"
            columns: ["bookable_id"]
            isOneToOne: false
            referencedRelation: "bookables"
            referencedColumns: ["id"]
          },
        ]
      }
      bookables: {
        Row: {
          add_ons: Json
          amenities: string[]
          archived_at: string | null
          blackout_dates: Json
          cancellation_policy: string | null
          console_type: string | null
          created_at: string
          description: string | null
          geo_lat: number | null
          geo_lng: number | null
          hourly_rate_paise: number | null
          id: string
          image_url: string | null
          images: string[]
          location: string | null
          name: string
          notice_hours: number
          operating_hours: string | null
          owner_profile_id: string
          rating: number | null
          response_time: string | null
          review_count: number
          slug: string
          updated_at: string
          verified_gold: boolean
          weekly_hours: Json
        }
        Insert: {
          add_ons?: Json
          amenities?: string[]
          archived_at?: string | null
          blackout_dates?: Json
          cancellation_policy?: string | null
          console_type?: string | null
          created_at?: string
          description?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          hourly_rate_paise?: number | null
          id?: string
          image_url?: string | null
          images?: string[]
          location?: string | null
          name: string
          notice_hours?: number
          operating_hours?: string | null
          owner_profile_id: string
          rating?: number | null
          response_time?: string | null
          review_count?: number
          slug: string
          updated_at?: string
          verified_gold?: boolean
          weekly_hours?: Json
        }
        Update: {
          add_ons?: Json
          amenities?: string[]
          archived_at?: string | null
          blackout_dates?: Json
          cancellation_policy?: string | null
          console_type?: string | null
          created_at?: string
          description?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          hourly_rate_paise?: number | null
          id?: string
          image_url?: string | null
          images?: string[]
          location?: string | null
          name?: string
          notice_hours?: number
          operating_hours?: string | null
          owner_profile_id?: string
          rating?: number | null
          response_time?: string | null
          review_count?: number
          slug?: string
          updated_at?: string
          verified_gold?: boolean
          weekly_hours?: Json
        }
        Relationships: [
          {
            foreignKeyName: "studios_owner_business_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_business"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "studios_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_requests: {
        Row: {
          bookable_id: string | null
          bookable_name: string | null
          created_at: string
          end_time: string | null
          hours: number | null
          id: string
          notes: string | null
          people: number | null
          purpose: string | null
          reply: string | null
          requester_name: string | null
          requester_profile_id: string | null
          service_id: string | null
          session_date: string
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bookable_id?: string | null
          bookable_name?: string | null
          created_at?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          people?: number | null
          purpose?: string | null
          reply?: string | null
          requester_name?: string | null
          requester_profile_id?: string | null
          service_id?: string | null
          session_date: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bookable_id?: string | null
          bookable_name?: string | null
          created_at?: string
          end_time?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          people?: number | null
          purpose?: string | null
          reply?: string | null
          requester_name?: string | null
          requester_profile_id?: string | null
          service_id?: string | null
          session_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "profile_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_studio_id_fkey"
            columns: ["bookable_id"]
            isOneToOne: false
            referencedRelation: "bookables"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_categories: {
        Row: {
          blurb: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          blurb?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          blurb?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      cms_pages: {
        Row: {
          body: Json
          category: string | null
          content: string
          kind: string | null
          popular_rank: number | null
          read_time: string | null
          related: string[]
          route: string
          seo_description: string | null
          slug: string
          sort_order: number
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          category?: string | null
          content?: string
          kind?: string | null
          popular_rank?: number | null
          read_time?: string | null
          related?: string[]
          route: string
          seo_description?: string | null
          slug: string
          sort_order?: number
          status: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          category?: string | null
          content?: string
          kind?: string | null
          popular_rank?: number | null
          read_time?: string | null
          related?: string[]
          route?: string
          seo_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["key"]
          },
        ]
      }
      collab_events: {
        Row: {
          city: string | null
          collab_id: string
          created_at: string
          date_precision: string
          event_date: string | null
          event_time: string | null
          id: string
          sort_order: number
          status: string | null
          ticket_note: string | null
          title: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          collab_id: string
          created_at?: string
          date_precision?: string
          event_date?: string | null
          event_time?: string | null
          id?: string
          sort_order?: number
          status?: string | null
          ticket_note?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          collab_id?: string
          created_at?: string
          date_precision?: string
          event_date?: string | null
          event_time?: string | null
          id?: string
          sort_order?: number
          status?: string | null
          ticket_note?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_events_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_events_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_gallery: {
        Row: {
          collab_id: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          collab_id: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          collab_id?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collab_gallery_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_gallery_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_invite_links: {
        Row: {
          active: boolean
          collab_id: string
          created_at: string
          created_by: string | null
          needs_approval: boolean
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          collab_id: string
          created_at?: string
          created_by?: string | null
          needs_approval?: boolean
          token?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          collab_id?: string
          created_at?: string
          created_by?: string | null
          needs_approval?: boolean
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_invite_links_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: true
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_invite_links_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: true
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_invite_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_live_videos: {
        Row: {
          collab_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          collab_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          collab_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_live_videos_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_live_videos_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_members: {
        Row: {
          collab_id: string
          created_at: string
          instrument: string | null
          invited_by: string | null
          profile_id: string
          role: string
          since_year: number | null
          sort_order: number
          status: string
        }
        Insert: {
          collab_id: string
          created_at?: string
          instrument?: string | null
          invited_by?: string | null
          profile_id: string
          role?: string
          since_year?: number | null
          sort_order?: number
          status?: string
        }
        Update: {
          collab_id?: string
          created_at?: string
          instrument?: string | null
          invited_by?: string | null
          profile_id?: string
          role?: string
          since_year?: number | null
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_messages: {
        Row: {
          body: string
          collab_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          collab_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          collab_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_messages_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_messages_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_private: {
        Row: {
          budget_paise: number | null
          collab_id: string
          updated_at: string
        }
        Insert: {
          budget_paise?: number | null
          collab_id: string
          updated_at?: string
        }
        Update: {
          budget_paise?: number | null
          collab_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_private_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: true
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_private_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: true
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_releases: {
        Row: {
          collab_id: string
          cover_url: string | null
          created_at: string
          id: string
          kind: string
          release_year: number | null
          sort_order: number
          title: string
        }
        Insert: {
          collab_id: string
          cover_url?: string | null
          created_at?: string
          id?: string
          kind: string
          release_year?: number | null
          sort_order?: number
          title: string
        }
        Update: {
          collab_id?: string
          cover_url?: string | null
          created_at?: string
          id?: string
          kind?: string
          release_year?: number | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "band_releases_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_releases_band_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      collabs: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          ends_on: string | null
          formed_year: number | null
          genres: string[]
          id: string
          is_verified: boolean
          looking_for: string[]
          name: string
          project_type: string | null
          rate_paise: number | null
          rate_unit: string | null
          rider: string[]
          slug: string
          stage_plot_note: string | null
          stage_plot_url: string | null
          starts_on: string | null
          status: string
          tagline: string | null
          type: string
          updated_at: string
          visibility: string
          work_mode: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          formed_year?: number | null
          genres?: string[]
          id?: string
          is_verified?: boolean
          looking_for?: string[]
          name: string
          project_type?: string | null
          rate_paise?: number | null
          rate_unit?: string | null
          rider?: string[]
          slug: string
          stage_plot_note?: string | null
          stage_plot_url?: string | null
          starts_on?: string | null
          status?: string
          tagline?: string | null
          type: string
          updated_at?: string
          visibility?: string
          work_mode?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          formed_year?: number | null
          genres?: string[]
          id?: string
          is_verified?: boolean
          looking_for?: string[]
          name?: string
          project_type?: string | null
          rate_paise?: number | null
          rate_unit?: string | null
          rider?: string[]
          slug?: string
          stage_plot_note?: string | null
          stage_plot_url?: string | null
          starts_on?: string | null
          status?: string
          tagline?: string | null
          type?: string
          updated_at?: string
          visibility?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          note: string | null
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          created_at: string
          last_read_at: string | null
          profile_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          last_read_at?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          last_read_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          business_profile_id: string
          created_at: string
          id: string
          intent: string
          message: string
          sender_profile_id: string
          status: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          id?: string
          intent: string
          message: string
          sender_profile_id: string
          status?: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          id?: string
          intent?: string
          message?: string
          sender_profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          audio_url: string | null
          author_profile_id: string
          body: string | null
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          media_urls: string[]
          post_type: string
        }
        Insert: {
          audio_url?: string | null
          author_profile_id: string
          body?: string | null
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          media_urls?: string[]
          post_type: string
        }
        Update: {
          audio_url?: string | null
          author_profile_id?: string
          body?: string | null
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          media_urls?: string[]
          post_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genre_languages: {
        Row: {
          genre_category: string
          genre_slug: string
          language_category: string
          language_slug: string
        }
        Insert: {
          genre_category?: string
          genre_slug: string
          language_category?: string
          language_slug: string
        }
        Update: {
          genre_category?: string
          genre_slug?: string
          language_category?: string
          language_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "genre_languages_genre_category_genre_slug_fkey"
            columns: ["genre_category", "genre_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "genre_languages_language_category_language_slug_fkey"
            columns: ["language_category", "language_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
        ]
      }
      help_feedback: {
        Row: {
          created_at: string
          helpful: boolean
          id: string
          page_slug: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          helpful: boolean
          id?: string
          page_slug: string
          profile_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          helpful?: boolean
          id?: string
          page_slug?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_feedback_page_slug_fkey"
            columns: ["page_slug"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "help_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          brand: string | null
          category: string
          condition: string | null
          created_at: string
          delivery_available: boolean
          delivery_fee_paise: number | null
          delivery_note: string | null
          deposit_paise: number | null
          id: string
          image_url: string | null
          included: string[]
          item_category: string | null
          item_category_kind: string | null
          listing_description: string | null
          listing_status: string
          max_days: number
          min_days: number
          model: string | null
          monthly_price_paise: number | null
          notice_period: string | null
          photos: string[]
          pickup_available: boolean
          pickup_location: string | null
          price_note: string | null
          price_paise: number | null
          price_unit: string | null
          quantity_available: number
          seller_name: string | null
          seller_profile_id: string | null
          slug: string
          specs: Json
          title: string
          unavailable_dates: string[]
          updated_at: string
          video_url: string | null
          weekly_price_paise: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_fee_paise?: number | null
          delivery_note?: string | null
          deposit_paise?: number | null
          id?: string
          image_url?: string | null
          included?: string[]
          item_category?: string | null
          item_category_kind?: string | null
          listing_description?: string | null
          listing_status?: string
          max_days?: number
          min_days?: number
          model?: string | null
          monthly_price_paise?: number | null
          notice_period?: string | null
          photos?: string[]
          pickup_available?: boolean
          pickup_location?: string | null
          price_note?: string | null
          price_paise?: number | null
          price_unit?: string | null
          quantity_available?: number
          seller_name?: string | null
          seller_profile_id?: string | null
          slug: string
          specs?: Json
          title: string
          unavailable_dates?: string[]
          updated_at?: string
          video_url?: string | null
          weekly_price_paise?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string
          delivery_available?: boolean
          delivery_fee_paise?: number | null
          delivery_note?: string | null
          deposit_paise?: number | null
          id?: string
          image_url?: string | null
          included?: string[]
          item_category?: string | null
          item_category_kind?: string | null
          listing_description?: string | null
          listing_status?: string
          max_days?: number
          min_days?: number
          model?: string | null
          monthly_price_paise?: number | null
          notice_period?: string | null
          photos?: string[]
          pickup_available?: boolean
          pickup_location?: string | null
          price_note?: string | null
          price_paise?: number | null
          price_unit?: string | null
          quantity_available?: number
          seller_name?: string | null
          seller_profile_id?: string | null
          slug?: string
          specs?: Json
          title?: string
          unavailable_dates?: string[]
          updated_at?: string
          video_url?: string | null
          weekly_price_paise?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_offers: {
        Row: {
          amount_paise: number
          buyer_profile_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          status: string
        }
        Insert: {
          amount_paise: number
          buyer_profile_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          status?: string
        }
        Update: {
          amount_paise?: number
          buyer_profile_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_offers_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channels: Json
          profile_id: string
          quiet_hours: boolean
          updated_at: string
        }
        Insert: {
          channels?: Json
          profile_id?: string
          quiet_hours?: boolean
          updated_at?: string
        }
        Update: {
          channels?: Json
          profile_id?: string
          quiet_hours?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_profile_id: string | null
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          recipient_profile_id: string
          title: string
        }
        Insert: {
          actor_profile_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          recipient_profile_id: string
          title: string
        }
        Update: {
          actor_profile_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          recipient_profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          applicant_count: number
          budget_note: string | null
          budget_paise: number | null
          budget_unit: string | null
          collaboration_type: string | null
          created_at: string
          creator_profile_id: string
          genres: string[]
          id: string
          location: string | null
          role_required: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          applicant_count?: number
          budget_note?: string | null
          budget_paise?: number | null
          budget_unit?: string | null
          collaboration_type?: string | null
          created_at?: string
          creator_profile_id: string
          genres?: string[]
          id?: string
          location?: string | null
          role_required?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          applicant_count?: number
          budget_note?: string | null
          budget_paise?: number | null
          budget_unit?: string | null
          collaboration_type?: string | null
          created_at?: string
          creator_profile_id?: string
          genres?: string[]
          id?: string
          location?: string | null
          role_required?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          applicant_profile_id: string
          created_at: string
          id: string
          message: string | null
          opportunity_id: string
          portfolio_item_ids: string[]
          status: string
          updated_at: string
        }
        Insert: {
          applicant_profile_id: string
          created_at?: string
          id?: string
          message?: string | null
          opportunity_id: string
          portfolio_item_ids?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_profile_id?: string
          created_at?: string
          id?: string
          message?: string | null
          opportunity_id?: string
          portfolio_item_ids?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_applicant_profile_id_fkey"
            columns: ["applicant_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_views: {
        Row: {
          id: number
          opportunity_id: string
          source: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: never
          opportunity_id: string
          source?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: never
          opportunity_id?: string
          source?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_views_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      person_type_instruments: {
        Row: {
          instrument_category: string
          instrument_slug: string
          person_type_category: string
          person_type_slug: string
        }
        Insert: {
          instrument_category?: string
          instrument_slug: string
          person_type_category?: string
          person_type_slug: string
        }
        Update: {
          instrument_category?: string
          instrument_slug?: string
          person_type_category?: string
          person_type_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_type_instruments_instrument_category_instrument_slu_fkey"
            columns: ["instrument_category", "instrument_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "person_type_instruments_person_type_category_person_type_s_fkey"
            columns: ["person_type_category", "person_type_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
        ]
      }
      person_type_service_categories: {
        Row: {
          person_type_category: string
          person_type_slug: string
          service_category_category: string
          service_category_slug: string
        }
        Insert: {
          person_type_category?: string
          person_type_slug: string
          service_category_category?: string
          service_category_slug: string
        }
        Update: {
          person_type_category?: string
          person_type_slug?: string
          service_category_category?: string
          service_category_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_type_service_categorie_person_type_category_person__fkey"
            columns: ["person_type_category", "person_type_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "person_type_service_categorie_service_category_category_se_fkey"
            columns: ["service_category_category", "service_category_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
        ]
      }
      portfolio_item_events: {
        Row: {
          created_at: string
          id: number
          item_id: string
          kind: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          item_id: string
          kind: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          item_id?: string
          kind?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_item_events_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_item_plays: {
        Row: {
          id: number
          item_id: string
          played_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: never
          item_id: string
          played_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: never
          item_id?: string
          played_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_item_plays_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          collaborators: string[]
          cover_url: string | null
          created_at: string
          description: string | null
          duration: string | null
          featured: boolean
          id: string
          kind: string
          likes_count: number
          media_url: string | null
          published: boolean
          release_year: number | null
          role: string | null
          shares_count: number
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          collaborators?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          id?: string
          kind?: string
          likes_count?: number
          media_url?: string | null
          published?: boolean
          release_year?: number | null
          role?: string | null
          shares_count?: number
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          collaborators?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          id?: string
          kind?: string
          likes_count?: number
          media_url?: string | null
          published?: boolean
          release_year?: number | null
          role?: string | null
          shares_count?: number
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      profile_business: {
        Row: {
          artist_roster: string[]
          business_address: string | null
          capacity: number | null
          courses: string[]
          equipment_list: string[]
          founded_year: number | null
          hero_banner_url: string | null
          icon_url: string | null
          legal_name: string | null
          logo_url: string | null
          maps_url: string | null
          operating_hours: string | null
          policies: string[]
          profile_id: string
          talent_roster: string[]
          thumbnail_url: string | null
          updated_at: string
          venue_features: string[]
        }
        Insert: {
          artist_roster?: string[]
          business_address?: string | null
          capacity?: number | null
          courses?: string[]
          equipment_list?: string[]
          founded_year?: number | null
          hero_banner_url?: string | null
          icon_url?: string | null
          legal_name?: string | null
          logo_url?: string | null
          maps_url?: string | null
          operating_hours?: string | null
          policies?: string[]
          profile_id: string
          talent_roster?: string[]
          thumbnail_url?: string | null
          updated_at?: string
          venue_features?: string[]
        }
        Update: {
          artist_roster?: string[]
          business_address?: string | null
          capacity?: number | null
          courses?: string[]
          equipment_list?: string[]
          founded_year?: number | null
          hero_banner_url?: string | null
          icon_url?: string | null
          legal_name?: string | null
          logo_url?: string | null
          maps_url?: string | null
          operating_hours?: string | null
          policies?: string[]
          profile_id?: string
          talent_roster?: string[]
          thumbnail_url?: string | null
          updated_at?: string
          venue_features?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profile_business_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_events: {
        Row: {
          event_date: string | null
          id: string
          profile_id: string
          sort_order: number
          title: string
          venue_name: string | null
        }
        Insert: {
          event_date?: string | null
          id?: string
          profile_id: string
          sort_order?: number
          title: string
          venue_name?: string | null
        }
        Update: {
          event_date?: string | null
          id?: string
          profile_id?: string
          sort_order?: number
          title?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_experience: {
        Row: {
          created_at: string
          detail: string | null
          end_year: number | null
          id: string
          org: string | null
          profile_id: string
          sort_order: number
          start_year: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          end_year?: number | null
          id?: string
          org?: string | null
          profile_id: string
          sort_order?: number
          start_year?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          end_year?: number | null
          id?: string
          org?: string | null
          profile_id?: string
          sort_order?: number
          start_year?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_experience_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          profile_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          profile_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          profile_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_gallery_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_members: {
        Row: {
          experience: string | null
          id: string
          is_leader: boolean
          kind: string
          name: string
          photo_url: string | null
          profile_id: string
          role: string | null
          since_year: number | null
          sort_order: number
          status: string
        }
        Insert: {
          experience?: string | null
          id?: string
          is_leader?: boolean
          kind: string
          name: string
          photo_url?: string | null
          profile_id: string
          role?: string | null
          since_year?: number | null
          sort_order?: number
          status?: string
        }
        Update: {
          experience?: string | null
          id?: string
          is_leader?: boolean
          kind?: string
          name?: string
          photo_url?: string | null
          profile_id?: string
          role?: string | null
          since_year?: number | null
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          business_phone: string | null
          date_of_birth: string | null
          device_platform: string | null
          email: string | null
          gender: string | null
          gstin: string | null
          id: string
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          business_phone?: string | null
          date_of_birth?: string | null
          device_platform?: string | null
          email?: string | null
          gender?: string | null
          gstin?: string | null
          id: string
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          business_phone?: string | null
          date_of_birth?: string | null
          device_platform?: string | null
          email?: string | null
          gender?: string | null
          gstin?: string | null
          id?: string
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profile_role_details: {
        Row: {
          details: Json
          profile_id: string
          role_slug: string
          updated_at: string
        }
        Insert: {
          details?: Json
          profile_id: string
          role_slug: string
          updated_at?: string
        }
        Update: {
          details?: Json
          profile_id?: string
          role_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_role_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_service_addons: {
        Row: {
          created_at: string
          id: string
          label: string
          price_paise: number
          price_unit: string | null
          profile_id: string
          service_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          price_paise: number
          price_unit?: string | null
          profile_id: string
          service_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          price_paise?: number
          price_unit?: string | null
          profile_id?: string
          service_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_service_addons_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_service_addons_service_fkey"
            columns: ["service_id", "profile_id"]
            isOneToOne: false
            referencedRelation: "profile_services"
            referencedColumns: ["id", "profile_id"]
          },
        ]
      }
      profile_service_packages: {
        Row: {
          created_at: string
          id: string
          includes: string[]
          is_popular: boolean
          name: string
          price_paise: number
          price_unit: string | null
          profile_id: string
          revisions: string | null
          service_id: string
          sort_order: number
          turnaround: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          includes?: string[]
          is_popular?: boolean
          name: string
          price_paise: number
          price_unit?: string | null
          profile_id: string
          revisions?: string | null
          service_id: string
          sort_order?: number
          turnaround?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          includes?: string[]
          is_popular?: boolean
          name?: string
          price_paise?: number
          price_unit?: string | null
          profile_id?: string
          revisions?: string | null
          service_id?: string
          sort_order?: number
          turnaround?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_service_packages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_service_packages_service_fkey"
            columns: ["service_id", "profile_id"]
            isOneToOne: false
            referencedRelation: "profile_services"
            referencedColumns: ["id", "profile_id"]
          },
        ]
      }
      profile_services: {
        Row: {
          amenity_slugs: string[]
          availability: string | null
          categories: string[]
          category: string | null
          category_taxonomy: string
          created_at: string
          deliverables: string[]
          description: string | null
          equipment_ids: string[]
          example_ids: string[]
          id: string
          min_hours: number | null
          mode: string | null
          name: string
          notice: string | null
          price_note: string | null
          price_paise: number | null
          price_unit: string | null
          pricing_model: string | null
          pricing_model_taxonomy: string
          profile_id: string
          requirements: string[]
          sort_order: number
          status: string
          turnaround: string | null
          updated_at: string
          work_modes: string[]
        }
        Insert: {
          amenity_slugs?: string[]
          availability?: string | null
          categories?: string[]
          category?: string | null
          category_taxonomy?: string
          created_at?: string
          deliverables?: string[]
          description?: string | null
          equipment_ids?: string[]
          example_ids?: string[]
          id?: string
          min_hours?: number | null
          mode?: string | null
          name: string
          notice?: string | null
          price_note?: string | null
          price_paise?: number | null
          price_unit?: string | null
          pricing_model?: string | null
          pricing_model_taxonomy?: string
          profile_id: string
          requirements?: string[]
          sort_order?: number
          status?: string
          turnaround?: string | null
          updated_at?: string
          work_modes?: string[]
        }
        Update: {
          amenity_slugs?: string[]
          availability?: string | null
          categories?: string[]
          category?: string | null
          category_taxonomy?: string
          created_at?: string
          deliverables?: string[]
          description?: string | null
          equipment_ids?: string[]
          example_ids?: string[]
          id?: string
          min_hours?: number | null
          mode?: string | null
          name?: string
          notice?: string | null
          price_note?: string | null
          price_paise?: number | null
          price_unit?: string | null
          pricing_model?: string | null
          pricing_model_taxonomy?: string
          profile_id?: string
          requirements?: string[]
          sort_order?: number
          status?: string
          turnaround?: string | null
          updated_at?: string
          work_modes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profile_services_category_fkey"
            columns: ["category_taxonomy", "category"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "profile_services_pricing_model_fkey"
            columns: ["pricing_model_taxonomy", "pricing_model"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "profile_services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area: string | null
          availability: string | null
          avatar_url: string | null
          bio: string | null
          budget_tier: string | null
          city: string | null
          contact_channels: string[]
          country: string | null
          cover_url: string | null
          created_at: string
          discovery_prefs: Json
          display_name: string | null
          experience_level: string | null
          first_name: string | null
          followers_count: number
          genres: string[]
          headline: string | null
          hourly_rate_paise: number | null
          id: string
          influences: string[]
          instruments: string[]
          intents: string[]
          is_available: boolean
          is_verified: boolean
          languages: string[]
          last_name: string | null
          links: Json
          onboarding_complete: boolean
          onboarding_draft: Json
          onboarding_step: string | null
          owner_id: string | null
          persona_badges: string[]
          pin_code: string | null
          qr_style: string
          rate_paise: number | null
          rate_unit: string | null
          rating: number | null
          response_time: string | null
          review_count: number
          roles: string[]
          specialisations: string[]
          state: string | null
          trust_badges: string[]
          updated_at: string
          username: string | null
          visibility: string
          work_modes: string[]
        }
        Insert: {
          area?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget_tier?: string | null
          city?: string | null
          contact_channels?: string[]
          country?: string | null
          cover_url?: string | null
          created_at?: string
          discovery_prefs?: Json
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          followers_count?: number
          genres?: string[]
          headline?: string | null
          hourly_rate_paise?: number | null
          id: string
          influences?: string[]
          instruments?: string[]
          intents?: string[]
          is_available?: boolean
          is_verified?: boolean
          languages?: string[]
          last_name?: string | null
          links?: Json
          onboarding_complete?: boolean
          onboarding_draft?: Json
          onboarding_step?: string | null
          owner_id?: string | null
          persona_badges?: string[]
          pin_code?: string | null
          qr_style?: string
          rate_paise?: number | null
          rate_unit?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number
          roles?: string[]
          specialisations?: string[]
          state?: string | null
          trust_badges?: string[]
          updated_at?: string
          username?: string | null
          visibility?: string
          work_modes?: string[]
        }
        Update: {
          area?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          budget_tier?: string | null
          city?: string | null
          contact_channels?: string[]
          country?: string | null
          cover_url?: string | null
          created_at?: string
          discovery_prefs?: Json
          display_name?: string | null
          experience_level?: string | null
          first_name?: string | null
          followers_count?: number
          genres?: string[]
          headline?: string | null
          hourly_rate_paise?: number | null
          id?: string
          influences?: string[]
          instruments?: string[]
          intents?: string[]
          is_available?: boolean
          is_verified?: boolean
          languages?: string[]
          last_name?: string | null
          links?: Json
          onboarding_complete?: boolean
          onboarding_draft?: Json
          onboarding_step?: string | null
          owner_id?: string | null
          persona_badges?: string[]
          pin_code?: string | null
          qr_style?: string
          rate_paise?: number | null
          rate_unit?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number
          roles?: string[]
          specialisations?: string[]
          state?: string | null
          trust_badges?: string[]
          updated_at?: string
          username?: string | null
          visibility?: string
          work_modes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device: string | null
          id: string
          platform: string
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          id?: string
          platform?: string
          profile_id?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device?: string | null
          id?: string
          platform?: string
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          created_at: string
          id: string
          scanned_profile_id: string
          scanner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scanned_profile_id: string
          scanner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scanned_profile_id?: string
          scanner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_scanned_profile_id_fkey"
            columns: ["scanned_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed: {
        Row: {
          avatar_url: string | null
          detail: string | null
          handle: string
          kind: string
          name: string | null
          profile_id: string
          viewed_at: string
        }
        Insert: {
          avatar_url?: string | null
          detail?: string | null
          handle: string
          kind: string
          name?: string | null
          profile_id: string
          viewed_at?: string
        }
        Update: {
          avatar_url?: string | null
          detail?: string | null
          handle?: string
          kind?: string
          name?: string | null
          profile_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_bookings: {
        Row: {
          created_at: string
          deposit_paise: number | null
          end_date: string
          fulfilment: string
          id: string
          listing_id: string
          note: string | null
          quantity: number
          renter_profile_id: string
          start_date: string
          status: string
          total_paise: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_paise?: number | null
          end_date: string
          fulfilment?: string
          id?: string
          listing_id: string
          note?: string | null
          quantity?: number
          renter_profile_id: string
          start_date: string
          status?: string
          total_paise?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_paise?: number | null
          end_date?: string
          fulfilment?: string
          id?: string
          listing_id?: string
          note?: string | null
          quantity?: number
          renter_profile_id?: string
          start_date?: string
          status?: string
          total_paise?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_bookings_renter_profile_id_fkey"
            columns: ["renter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_profile_id: string
          status: string
          subject_id: string
          subject_type: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_profile_id?: string
          status?: string
          subject_id: string
          subject_type: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_profile_id?: string
          status?: string
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_profile_id_fkey"
            columns: ["reporter_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reserved_usernames: {
        Row: {
          created_at: string
          name: string
          reason: string
        }
        Insert: {
          created_at?: string
          name: string
          reason?: string
        }
        Update: {
          created_at?: string
          name?: string
          reason?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          asked_at: string
          asked_profile_id: string
          context: string | null
          reminded_at: string | null
          requester_profile_id: string
        }
        Insert: {
          asked_at?: string
          asked_profile_id: string
          context?: string | null
          reminded_at?: string | null
          requester_profile_id?: string
        }
        Update: {
          asked_at?: string
          asked_profile_id?: string
          context?: string | null
          reminded_at?: string | null
          requester_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_asked_profile_id_fkey"
            columns: ["asked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          author_org: string | null
          author_profile_id: string | null
          body: string
          context: string | null
          created_at: string
          id: string
          rating: number
          response: string | null
          tags: string[]
          target_bookable_id: string | null
          target_profile_id: string | null
        }
        Insert: {
          author_name: string
          author_org?: string | null
          author_profile_id?: string | null
          body: string
          context?: string | null
          created_at?: string
          id?: string
          rating: number
          response?: string | null
          tags?: string[]
          target_bookable_id?: string | null
          target_profile_id?: string | null
        }
        Update: {
          author_name?: string
          author_org?: string | null
          author_profile_id?: string | null
          body?: string
          context?: string | null
          created_at?: string
          id?: string
          rating?: number
          response?: string | null
          tags?: string[]
          target_bookable_id?: string | null
          target_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_studio_id_fkey"
            columns: ["target_bookable_id"]
            isOneToOne: false
            referencedRelation: "bookables"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          profile_id: string
          query: string
          scope: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          profile_id?: string
          query: string
          scope: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          profile_id?: string
          query?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_events: {
        Row: {
          city: string | null
          created_at: string
          id: number
          profile_id: string | null
          query: string
          scope: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: never
          profile_id?: string | null
          query: string
          scope: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: never
          profile_id?: string | null
          query?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_feedback: {
        Row: {
          created_at: string
          id: string
          profile_id: string | null
          query: string | null
          reason: string
          subject_id: string
          subject_kind: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id?: string | null
          query?: string | null
          reason: string
          subject_id: string
          subject_kind: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string | null
          query?: string | null
          reason?: string
          subject_id?: string
          subject_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_category_specialties: {
        Row: {
          option_category: string
          option_slug: string
          service_category_category: string
          service_category_slug: string
        }
        Insert: {
          option_category: string
          option_slug: string
          service_category_category?: string
          service_category_slug: string
        }
        Update: {
          option_category?: string
          option_slug?: string
          service_category_category?: string
          service_category_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_category_specialties_option_category_option_slug_fkey"
            columns: ["option_category", "option_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "service_category_specialties_service_category_category_ser_fkey"
            columns: ["service_category_category", "service_category_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
        ]
      }
      spotify_connections: {
        Row: {
          access_token: string
          created_at: string
          display_name: string | null
          expires_at: string
          refresh_token: string
          revoked: boolean
          scopes: string
          sharing: string
          spotify_user_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          display_name?: string | null
          expires_at: string
          refresh_token: string
          revoked?: boolean
          scopes: string
          sharing?: string
          spotify_user_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          display_name?: string | null
          expires_at?: string
          refresh_token?: string
          revoked?: boolean
          scopes?: string
          sharing?: string
          spotify_user_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          page_slug: string | null
          profile_id: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page_slug?: string | null
          profile_id?: string
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page_slug?: string | null
          profile_id?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_page_slug_fkey"
            columns: ["page_slug"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "support_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_categories: {
        Row: {
          created_at: string
          description: string
          is_published: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          is_published?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          is_published?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy_options: {
        Row: {
          category_key: string
          created_at: string
          is_published: boolean
          label: string
          metadata: Json | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          is_published?: boolean
          label: string
          metadata?: Json | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          is_published?: boolean
          label?: string
          metadata?: Json | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taxonomy_options_category_key_fkey"
            columns: ["category_key"]
            isOneToOne: false
            referencedRelation: "taxonomy_categories"
            referencedColumns: ["key"]
          },
        ]
      }
      verification_request_items: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          info_text: string | null
          kind: string
          profile_id: string
          request_id: string
          requirement_id: string
          sort_order: number
          state: string
          type_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          info_text?: string | null
          kind: string
          profile_id: string
          request_id: string
          requirement_id: string
          sort_order?: number
          state?: string
          type_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          info_text?: string | null
          kind?: string
          profile_id?: string
          request_id?: string
          requirement_id?: string
          sort_order?: number
          state?: string
          type_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_request_items_request_fkey"
            columns: ["request_id", "profile_id", "type_slug"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id", "profile_id", "type_slug"]
          },
          {
            foreignKeyName: "verification_request_items_requirement_fkey"
            columns: ["requirement_id", "type_slug", "kind"]
            isOneToOne: false
            referencedRelation: "verification_requirements"
            referencedColumns: ["id", "type_slug", "kind"]
          },
        ]
      }
      verification_request_private: {
        Row: {
          created_at: string
          id_number: string | null
          id_type: string | null
          id_type_category: string
          phone: string | null
          profile_id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id_number?: string | null
          id_type?: string | null
          id_type_category?: string
          phone?: string | null
          profile_id: string
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id_number?: string | null
          id_type?: string | null
          id_type_category?: string
          phone?: string | null
          profile_id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_request_private_id_type_fkey"
            columns: ["id_type_category", "id_type"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "verification_request_private_request_fkey"
            columns: ["request_id", "profile_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id", "profile_id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          submitted_at: string | null
          type_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string | null
          type_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_note?: string | null
          status?: string
          submitted_at?: string | null
          type_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_type_slug_fkey"
            columns: ["type_slug"]
            isOneToOne: false
            referencedRelation: "verification_type_details"
            referencedColumns: ["type_slug"]
          },
        ]
      }
      verification_requirements: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean
          kind: string
          label: string
          private_field: string | null
          slug: string
          sort_order: number
          type_slug: string
          updated_at: string
          why: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean
          kind: string
          label: string
          private_field?: string | null
          slug: string
          sort_order?: number
          type_slug: string
          updated_at?: string
          why: string
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean
          kind?: string
          label?: string
          private_field?: string | null
          slug?: string
          sort_order?: number
          type_slug?: string
          updated_at?: string
          why?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requirements_type_slug_fkey"
            columns: ["type_slug"]
            isOneToOne: false
            referencedRelation: "verification_type_details"
            referencedColumns: ["type_slug"]
          },
        ]
      }
      verification_type_details: {
        Row: {
          applies_to: string
          applies_to_every_profile: boolean
          applies_without_role: boolean
          created_at: string
          grants_is_verified: boolean
          locked_reason: string | null
          prerequisite_category: string
          prerequisite_slug: string | null
          trust_badge_category: string
          trust_badge_slug: string | null
          turnaround: string
          type_category: string
          type_slug: string
          updated_at: string
          verifies: string
          what_others_see: string
        }
        Insert: {
          applies_to: string
          applies_to_every_profile?: boolean
          applies_without_role?: boolean
          created_at?: string
          grants_is_verified?: boolean
          locked_reason?: string | null
          prerequisite_category?: string
          prerequisite_slug?: string | null
          trust_badge_category?: string
          trust_badge_slug?: string | null
          turnaround: string
          type_category?: string
          type_slug: string
          updated_at?: string
          verifies: string
          what_others_see: string
        }
        Update: {
          applies_to?: string
          applies_to_every_profile?: boolean
          applies_without_role?: boolean
          created_at?: string
          grants_is_verified?: boolean
          locked_reason?: string | null
          prerequisite_category?: string
          prerequisite_slug?: string | null
          trust_badge_category?: string
          trust_badge_slug?: string | null
          turnaround?: string
          type_category?: string
          type_slug?: string
          updated_at?: string
          verifies?: string
          what_others_see?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_type_details_prerequisite_category_prerequisi_fkey"
            columns: ["prerequisite_category", "prerequisite_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "verification_type_details_trust_badge_category_trust_badge_fkey"
            columns: ["trust_badge_category", "trust_badge_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "verification_type_details_type_category_type_slug_fkey"
            columns: ["type_category", "type_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
        ]
      }
      verification_type_person_types: {
        Row: {
          person_type_category: string
          person_type_slug: string
          type_slug: string
        }
        Insert: {
          person_type_category?: string
          person_type_slug: string
          type_slug: string
        }
        Update: {
          person_type_category?: string
          person_type_slug?: string
          type_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_type_person_type_person_type_category_person__fkey"
            columns: ["person_type_category", "person_type_slug"]
            isOneToOne: false
            referencedRelation: "taxonomy_options"
            referencedColumns: ["category_key", "slug"]
          },
          {
            foreignKeyName: "verification_type_person_types_type_slug_fkey"
            columns: ["type_slug"]
            isOneToOne: false
            referencedRelation: "verification_type_details"
            referencedColumns: ["type_slug"]
          },
        ]
      }
    }
    Views: {
      band_events: {
        Row: {
          band_id: string | null
          city: string | null
          created_at: string | null
          date_precision: string | null
          event_date: string | null
          event_time: string | null
          id: string | null
          sort_order: number | null
          status: string | null
          ticket_note: string | null
          title: string | null
          venue: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_events_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_events_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      band_members: {
        Row: {
          band_id: string | null
          created_at: string | null
          instrument: string | null
          profile_id: string | null
          role: string | null
          since_year: number | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      band_releases: {
        Row: {
          band_id: string | null
          cover_url: string | null
          created_at: string | null
          id: string | null
          kind: string | null
          release_year: number | null
          sort_order: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "band_releases_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "bands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "band_releases_band_id_fkey"
            columns: ["band_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["id"]
          },
        ]
      }
      bands: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string | null
          formed_year: number | null
          genres: string[] | null
          id: string | null
          is_verified: boolean | null
          looking_for: string[] | null
          name: string | null
          rate_paise: number | null
          rate_unit: string | null
          slug: string | null
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          formed_year?: number | null
          genres?: string[] | null
          id?: string | null
          is_verified?: boolean | null
          looking_for?: string[] | null
          name?: string | null
          rate_paise?: number | null
          rate_unit?: string | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          formed_year?: number | null
          genres?: string[] | null
          id?: string | null
          is_verified?: boolean | null
          looking_for?: string[] | null
          name?: string | null
          rate_paise?: number | null
          rate_unit?: string | null
          slug?: string | null
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bookable_busy: {
        Args: { p_from: string; p_studio: string; p_to: string }
        Returns: {
          ends_at: string
          starts_at: string
        }[]
      }
      bookable_is_mine: { Args: { p_studio_id: string }; Returns: boolean }
      can_review_bookable: { Args: { p_studio_id: string }; Returns: boolean }
      can_review_profile: {
        Args: { p_target_profile_id: string }
        Returns: boolean
      }
      collab_can_manage: { Args: { p_collab_id: string }; Returns: boolean }
      collab_can_write: { Args: { p_collab_id: string }; Returns: boolean }
      collab_is_owner: { Args: { p_collab_id: string }; Returns: boolean }
      collab_is_readable: { Args: { p_collab_id: string }; Returns: boolean }
      contact_phone: { Args: { p_profile: string }; Returns: string }
      conversation_has_member: {
        Args: { p_conversation_id: string; p_profile_id: string }
        Returns: boolean
      }
      could_review_me: {
        Args: { p_asked_profile_id: string }
        Returns: boolean
      }
      display_name_of: { Args: { p_profile_id: string }; Returns: string }
      is_talent: { Args: { p_profile_id: string }; Returns: boolean }
      join_collab_by_link: { Args: { p_token: string }; Returns: Json }
      listing_is_mine: { Args: { p_listing_id: string }; Returns: boolean }
      notify: {
        Args: {
          p_actor: string
          p_body: string
          p_href: string
          p_kind: string
          p_recipient: string
          p_title: string
        }
        Returns: undefined
      }
      opportunity_is_mine: {
        Args: { p_opportunity_id: string }
        Returns: boolean
      }
      opportunity_save_count: { Args: { opp: string }; Returns: number }
      opportunity_view_sources: {
        Args: { opp: string }
        Returns: {
          source: string
          views: number
        }[]
      }
      opportunity_view_stats: {
        Args: { opp: string }
        Returns: {
          day: string
          views: number
        }[]
      }
      persona_bucket: {
        Args: {
          p_languages?: string[]
          p_limit?: number
          p_primary: string
          p_secondary?: string[]
        }
        Returns: {
          category_key: string
          display_order: number
          label: string
          slug: string
        }[]
      }
      popular_searches: {
        Args: { lim?: number; p_city?: string; p_scope: string }
        Returns: {
          query: string
          searches: number
        }[]
      }
      portfolio_event_allowed: {
        Args: { p_item: string; p_kind: string }
        Returns: boolean
      }
      portfolio_item_is_mine: { Args: { p_item: string }; Returns: boolean }
      portfolio_save_count: { Args: { p_item: string }; Returns: number }
      profile_is_readable: { Args: { p_profile_id: string }; Returns: boolean }
      profile_response_time: { Args: { p: string }; Returns: string }
      profile_service_is_mine: {
        Args: { p_service_id: string }
        Returns: boolean
      }
      profile_service_is_readable: {
        Args: { p_service_id: string }
        Returns: boolean
      }
      recompute_review_stats: {
        Args: { p_profile: string; p_studio: string }
        Returns: undefined
      }
      record_opportunity_view: {
        Args: { opp: string; src?: string }
        Returns: undefined
      }
      record_portfolio_play: { Args: { item: string }; Returns: undefined }
      rental_booking_counts: {
        Args: never
        Returns: {
          bookings: number
          listing_id: string
        }[]
      }
      rental_listing_is_mine: {
        Args: { p_listing_id: string }
        Returns: boolean
      }
      start_collab: {
        Args: {
          p_bio?: string
          p_city?: string
          p_ends_on?: string
          p_name: string
          p_type?: string
          p_visibility?: string
        }
        Returns: string
      }
      start_conversation: {
        Args: { p_other_profile_id: string }
        Returns: string
      }
      trending_portfolio_items: {
        Args: { days?: number; lim?: number }
        Returns: {
          cover_url: string
          display_name: string
          id: string
          kind: string
          media_url: string
          plays: number
          title: string
          username: string
        }[]
      }
      username_available: { Args: { p_username: string }; Returns: boolean }
      verification_decide: {
        Args: {
          p_expires_at?: string
          p_rejection_reason?: string
          p_request_id: string
          p_reviewed_by?: string
          p_reviewer_note?: string
          p_status: string
        }
        Returns: {
          created_at: string
          expires_at: string | null
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_note: string | null
          status: string
          submitted_at: string | null
          type_slug: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "verification_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verification_expire_due: { Args: never; Returns: number }
      verification_prerequisite_met: {
        Args: { p_profile_id: string; p_type: string }
        Returns: boolean
      }
      verification_request_missing: {
        Args: { p_request_id: string }
        Returns: string[]
      }
      verification_sync_trust: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      verification_type_applies: {
        Args: { p_profile_id: string; p_type: string }
        Returns: boolean
      }
      verification_types_for: { Args: { p_roles: string[] }; Returns: string[] }
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
