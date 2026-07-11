// =============================================
// HOT BLOOD FC — Landing Data Hook
// Fetches live data from DB so management updates appear instantly
// =============================================

import { useState, useEffect } from 'react'
import { supabase } from '../helpers/supabase'
import type { Player, SlideshowItem, Sponsor } from '../types'

interface ManOfMatch {
  id: string
  player_name: string
  player_avatar_url: string | null
  player_position: string | null
  team_name: string | null
  rating_average: number
}

interface LandingData {
  slideshow: SlideshowItem[]
  players: Player[]
  sponsors: Sponsor[]
  manOfMatch: ManOfMatch[]
  clubLogo: string
  loading: boolean
}

export function useLandingData(): LandingData {
  const [data, setData] = useState<LandingData>({
    slideshow: [],
    players: [],
    sponsors: [],
    manOfMatch: [],
    clubLogo: '/images/logo.png',
    loading: true,
  })

  useEffect(() => {
    const fetchAll = async () => {
      const [slideRes, playerRes, sponsorRes, momRes, settingsRes] = await Promise.all([
        supabase.from('slideshow_items').select('*').eq('is_active', true).order('display_order'),
        supabase.from('players').select('*').eq('is_active', true).order('jersey_number'),
        supabase.from('sponsors').select('*').eq('is_active', true).order('tier'),
        supabase.from('man_of_match').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('site_settings').select('*').eq('key', 'club_logo').single(),
      ])

      const clubLogo = settingsRes.data?.value || '/images/logo.png'

      setData({
        slideshow: (slideRes.data as SlideshowItem[]) || [],
        players: (playerRes.data as Player[]) || [],
        sponsors: (sponsorRes.data as Sponsor[]) || [],
        manOfMatch: (momRes.data as ManOfMatch[]) || [],
        clubLogo,
        loading: false,
      })
    }

    fetchAll()

    // Realtime: refresh when any of these tables change
    const channel = supabase
      .channel('landing_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slideshow_items' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsors' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'man_of_match' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, fetchAll)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return data
}
