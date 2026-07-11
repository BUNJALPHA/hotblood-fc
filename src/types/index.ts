// =============================================
// HOT BLOOD FC — Shared Types
// Used across management + public dashboards
// =============================================

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';
export type ViewMode = 'list' | 'schedule' | 'live' | 'summary' | 'attendance' | 'leagues';

export interface Match {
  id: string;
  opponent: string;
  our_score: number | null;
  opponent_score: number | null;
  competition: string;
  is_home: boolean;
  match_date: string;
  match_time: string | null;
  venue: string | null;
  status: MatchStatus;
  is_live: boolean;
  stream_key: string | null;
  summary: string | null;
  summary_visible_until: string | null;
  league_id?: string | null;
  match_type?: 'league' | 'friendly' | 'cup' | 'tournament' | null;
  first_11?: string[] | null;
  substitutes?: string[] | null;
  ended_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface League {
  id: string;
  name: string;
  season: string;
  logo_url: string | null;
  description?: string | null;
  sponsor?: string | null;
  match_days?: string | null;
  status: 'active' | 'completed' | 'upcoming';
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LeagueTeam {
  id: string;
  league_id: string;
  team_name: string;
  short_name?: string | null;
  logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  created_at?: string;
}

export interface LeaguePlayer {
  id: string;
  league_team_id: string;
  name: string;
  position: string | null;
  jersey_number: number | null;
  avatar_url: string | null;
  age: number | null;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  man_of_match_count: number;
  is_captain: boolean;
  created_at?: string;
}

export interface Player {
  id: string;
  full_name: string;
  name?: string; // alias for some legacy code
  jersey_number: number;
  position: string;
  photo_url?: string | null;
  avatar_url?: string | null;
  category?: 'senior' | 'junior' | null;
  date_of_birth?: string | null;
  join_date?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  fitness_status?: 'fit' | 'injured' | 'suspended' | 'recovering';
  injury_notes?: string | null;
  is_active: boolean;
  status?: 'active' | 'inactive';
  goals?: number;
  assists?: number;
  attendance_rate?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string;
  images: string[];
  is_active: boolean;
  offer_percentage: number;
  created_at?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  poster_url: string | null;
  is_pinned: boolean;
  published_by: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference_code?: string | null;
  payment_method: string;
  recorded_by?: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  user_id: string | null;
  donor_name: string | null;
  amount: number;
  message: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Ticket {
  id: string;
  match_id: string;
  buyer_id: string;
  ticket_code: string;
  qr_code_url: string | null;
  price: number;
  total_price?: number;
  is_donation_ticket: boolean;
  quantity: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  valid_until: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'save' | 'var_review';
  player_id: string;
  player_name?: string | null;
  assist_player_id?: string | null;
  assist_player_name?: string | null;
  team_side?: 'home' | 'away' | null;
  minute: number;
  description: string;
  created_at?: string;
}

export interface LiveUpdate {
  id: string;
  match_id: string;
  update_type: 'goal' | 'card' | 'substitution' | 'injury' | 'status' | 'photo' | 'text';
  headline: string | null;
  description: string | null;
  image_url: string | null;
  minute: number | null;
  team_side?: 'home' | 'away' | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: 'match_highlight' | 'training' | 'interview' | 'other';
  match_id: string | null;
  is_featured?: boolean;
  view_count?: number;
  duration_seconds?: number | null;
  uploaded_by?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: 'gold' | 'silver' | 'bronze';
  is_active: boolean;
  created_at?: string;
}

export interface SlideshowItem {
  id: string;
  title: string | null;
  subtitle: string | null;
  tag: string | null;
  stat_value: string | null;
  stat_label: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
