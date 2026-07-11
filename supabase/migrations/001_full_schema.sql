-- =============================================
-- HOT BLOOD FC — FULL DATABASE MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================

-- 1. PROFILES (fixes auth flow — code writes here, app reads here)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  nickname TEXT,
  avatar_url TEXT,
  favorite_player TEXT,
  favorite_team TEXT,
  role TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('super_admin', 'admin', 'fan')),
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERSHIP CARDS
CREATE TABLE IF NOT EXISTS membership_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_number TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'vip')),
  card_image_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_membership_cards_user ON membership_cards(user_id);

-- 3. TICKETS
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  ticket_code TEXT UNIQUE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_ticket DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  payment_method TEXT,
  payment_reference TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_match ON tickets(match_id);

-- 4. DONATIONS
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 6. MATCH EVENTS (goals, cards, substitutions with minute)
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'injury', 'save', 'var_review')),
  player_id UUID,
  player_name TEXT,
  team_side TEXT CHECK (team_side IN ('home', 'away')),
  assist_player_name TEXT,
  minute INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);

-- 7. LIVE MATCH UPDATES (real-time text/photo updates from admin)
CREATE TABLE IF NOT EXISTS live_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('goal', 'card', 'substitution', 'injury', 'status', 'photo', 'text')),
  headline TEXT,
  description TEXT,
  image_url TEXT,
  minute INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_live_updates_match ON live_updates(match_id);

-- 8. CHAT MESSAGES
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'general';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 9. VIDEOS
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'match_highlight' CHECK (category IN ('match_highlight', 'training', 'interview', 'other')),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LEAGUES (ensure all columns exist)
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS sponsor TEXT;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS match_days TEXT;
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 11. LEAGUE TEAMS (teams participating in a league)
CREATE TABLE IF NOT EXISTS league_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, team_name)
);
CREATE INDEX IF NOT EXISTS idx_league_teams_league ON league_teams(league_id);

-- 12. LEAGUE PLAYERS (players from any team in the league)
CREATE TABLE IF NOT EXISTS league_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_team_id UUID NOT NULL REFERENCES league_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  jersey_number INTEGER,
  avatar_url TEXT,
  age INTEGER,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  man_of_match_count INTEGER DEFAULT 0,
  is_captain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_league_players_team ON league_players(league_team_id);

-- 13. PLAYER RATINGS (fans rate players after matches)
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id, match_id)
);

-- 14. MATCH PREDICTIONS (fans predict match outcomes)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- 15. MANAGEMENT ACTION CODES (for super admin authorization)
CREATE TABLE IF NOT EXISTS admin_action_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. MATCH MAN OF THE MATCH
CREATE TABLE IF NOT EXISTS man_of_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  player_name TEXT NOT NULL,
  player_avatar_url TEXT,
  player_position TEXT,
  team_name TEXT,
  league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. SITE SETTINGS (logo, sponsors, slideshow content)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES
  ('club_logo', '/images/logo.png'),
  ('club_name', 'Hot Blood FC'),
  ('club_motto', 'Passion, Power, Victory')
ON CONFLICT (key) DO NOTHING;

-- 18. SPONSORS
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  tier TEXT DEFAULT 'gold' CHECK (tier IN ('gold', 'silver', 'bronze')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. ACTIVITY LOGS (track all admin actions)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- 20. SLIDESHOW ITEMS (landing page hero slideshow)
CREATE TABLE IF NOT EXISTS slideshow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  tag TEXT,
  stat_value TEXT,
  stat_label TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Ensure match_time column exists on matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_time TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 22. Ensure chat_messages has all needed columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='channel') THEN
    ALTER TABLE chat_messages ADD COLUMN channel TEXT DEFAULT 'general';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='user_name') THEN
    ALTER TABLE chat_messages ADD COLUMN user_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='avatar_url') THEN
    ALTER TABLE chat_messages ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 23. RLS POLICIES (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE man_of_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slideshow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins read all
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Membership cards
CREATE POLICY "Read own cards" ON membership_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own card" ON membership_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tickets
CREATE POLICY "Read own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Donations
CREATE POLICY "Read all donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Insert own donation" ON donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Match events & live updates: public read, admin write
CREATE POLICY "Public read events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Admin write events" ON match_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Public read live updates" ON live_updates FOR SELECT USING (true);
CREATE POLICY "Admin write live updates" ON live_updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Videos, sponsors, slideshow, site_settings: public read
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Admin write videos" ON videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Public read sponsors" ON sponsors FOR SELECT USING (true);
CREATE POLICY "Public read slideshow" ON slideshow_items FOR SELECT USING (true);
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);

-- League teams & players: public read, admin write
CREATE POLICY "Public read league teams" ON league_teams FOR SELECT USING (true);
CREATE POLICY "Admin write league teams" ON league_teams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Admin update league teams" ON league_teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Public read league players" ON league_players FOR SELECT USING (true);
CREATE POLICY "Admin write league players" ON league_players FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Admin update league players" ON league_players FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Player ratings: public read/write own
CREATE POLICY "Public read ratings" ON player_ratings FOR SELECT USING (true);
CREATE POLICY "Users write ratings" ON player_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Predictions: public read, users write own
CREATE POLICY "Public read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Users write predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Man of match: public read
CREATE POLICY "Public read man of match" ON man_of_match FOR SELECT USING (true);

-- Admin action codes: admin read/write
CREATE POLICY "Admins read codes" ON admin_action_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);
CREATE POLICY "Super admin write codes" ON admin_action_codes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Admins use codes" ON admin_action_codes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Activity logs: admins read, system inserts
CREATE POLICY "Admins read logs" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Chat messages: public read/write
CREATE POLICY "Public read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users write chat" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DONE. Now rotate your service_role key.
-- =============================================
