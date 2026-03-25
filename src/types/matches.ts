export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface Match {
  id: string;
  opponent: string;
  our_score: number | null;
  opponent_score: number | null;
  competition: string;
  is_home: boolean;
  match_date: string;
  match_time: string;
  venue: string | null;
  status: MatchStatus;
  is_live: boolean;
  stream_key: string | null;
  summary: string | null;
  summary_visible_until: string | null;
  league_id?: string;
  match_type?: 'league' | 'friendly' | 'cup' | 'tournament';
  created_at?: string;
  updated_at?: string;
}

export interface League {
  id: string;
  name: string;
  season: string;
  logo_url: string | null;
  description: string | null;
  status: 'active' | 'completed' | 'upcoming';
  created_at: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  avatar_url?: string;
  status?: 'active' | 'inactive';
}

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'save';
  player_id: string;
  assist_player_id?: string;
  minute: number;
  description: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  match_id: string;
  player_id: string;
  status: 'confirmed' | 'declined' | 'pending' | 'injured';
  notes: string | null;
  confirmed_at: string | null;
  created_at?: string;
}

export type ViewMode = 'list' | 'schedule' | 'live' | 'summary' | 'attendance' | 'leagues';
export interface Match {
  // ... existing fields
  ended_at?: string | null;
}