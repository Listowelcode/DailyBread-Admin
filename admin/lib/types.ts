export type DailyMessageStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "sent"
  | "archived";

export type JourneyStatus = "draft" | "published" | "archived";

export interface SubscribeInput {
  full_name: string;
  email: string;
  timezone: string;
}

export interface JourneyEnrollment {
  id: string;
  journey_id: string;
  journey_title: string;
  status: "active" | "paused" | "completed" | "abandoned";
  current_day: number;
  started_at: string;
  last_activity_at: string | null;
  completed_at: string | null;
}

export interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  todays_word_enabled: boolean;
  spiritual_journey_enabled: boolean;
  timezone: string;
  todays_word_time: string | null;
  spiritual_journey_time: string | null;
  status?: "active" | "paused" | "unsubscribed";
  created_at?: string;
  last_active_at?: string | null;
  journey_enrollments?: JourneyEnrollment[];
}

export interface AdminSession {
  authenticated: boolean;
  access_token: string;
  token_type: "bearer";
  admin_id: string;
  email: string;
  full_name: string;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
}

export interface DailyMessage {
  id: string;
  message_date: string;
  title: string;
  scripture_reference: string | null;
  scripture_link: string | null;
  message: string;
  encouragement: string | null;
  bible_reading: string | null;
  prayer: string | null;
  reflection: string | null;
  status: DailyMessageStatus;
  approval_method: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyMessageInput {
  message_date: string;
  title: string;
  scripture_reference?: string | null;
  scripture_link?: string | null;
  message: string;
  encouragement?: string | null;
  bible_reading?: string | null;
  prayer?: string | null;
  reflection?: string | null;
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  category: string | null;
  duration_days: number;
  status: JourneyStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JourneyDay {
  id: string;
  journey_id: string;
  day_number: number;
  title: string;
  scripture_reference: string | null;
  lesson: string;
  encouragement: string | null;
  bible_reading: string | null;
  prayer: string | null;
  reflection: string | null;
}

export interface JourneySource {
  id: string;
  journey_id: string;
  source_type: string | null;
  title: string;
  url: string;
  notes: string | null;
}

export interface JourneyDetail extends Journey {
  days: JourneyDay[];
  sources: JourneySource[];
}

export interface AdminSettings {
  id: string;
  site_name: string;
  default_timezone: string;
  todays_word_enabled: boolean;
  default_todays_word_time: string;
  ai_daily_generation_enabled: boolean;
  ai_daily_auto_approval: boolean;
  spiritual_journey_generation_enabled: boolean;
  default_spiritual_journey_time: string;
  journey_manual_approval_required: boolean;
  journey_generation_interval_days: number;
  welcome_email_enabled: boolean;
  journey_completion_email_enabled: boolean;
}

export type AdminSettingsUpdate = Partial<Omit<AdminSettings, "id">>;

export interface AdminStats {
  total_subscribers: number;
  active_subscribers: number;
  new_this_week: number;
  total_messages: number;
  pending_messages: number;
  total_journeys: number;
  published_journeys: number;
  emails_sent_today: number;
  total_journey_enrollments: number;
  active_journey_enrollments: number;
}

export interface DailyEmailCount {
  date: string;
  count: number;
}

export interface AdminOverview {
  refreshed_at: string;
  stats: AdminStats;
  emails_sent_by_day: DailyEmailCount[];
  subscribers: Subscriber[];
}

export interface SubscriberPage {
  page: number;
  page_size: number;
  search: string;
  total: number;
  total_pages: number;
  subscribers: Subscriber[];
}

export type AnnouncementStatus = "draft" | "scheduled" | "sent";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  scheduled_at: string | null;
  sent_at: string | null;
  status: AnnouncementStatus;
  emails_sent_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementPage {
  page: number;
  page_size: number;
  search: string;
  total: number;
  total_pages: number;
  announcements: Announcement[];
}

export interface AnnouncementInput {
  title: string;
  body: string;
  scheduled_at?: string | null;
}

export interface AnnouncementUpdate {
  title?: string;
  body?: string;
  scheduled_at?: string | null;
}

export interface JourneyInput {
  title: string;
  description: string;
  category?: string | null;
  duration_days: number;
}

export interface JourneyDayInput {
  day_number: number;
  title: string;
  scripture_reference: string;
  lesson: string;
  encouragement?: string | null;
  bible_reading?: string | null;
  prayer: string;
  reflection?: string | null;
}

export interface JourneySourceInput {
  source_type?: string | null;
  title: string;
  url: string;
  notes?: string | null;
}

export interface ApiError {
  detail: string;
}
