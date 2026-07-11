// =============================================
// HOT BLOOD FC — Membership Card
// Canvas-based premium card, downloadable as PNG
// =============================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Download, Crown, Sparkles, Shield } from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { insertRow, generateCode } from '../../helpers/api'
import { useToast, Button } from '../ui/Toast'

interface MemberInfo {
  full_name: string
  email: string
  nickname: string
  avatar_url: string
  member_id: string
  tier: 'free' | 'premium' | 'vip'
  join_date: string
}

export default function MembershipCard({ profile }: { profile: any }) {
  const { show } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cardData, setCardData] = useState<MemberInfo | null>(null)
  const [existingCard, setExistingCard] = useState<any>(null)

  // Check if card already exists, if not create one
  useEffect(() => {
    const init = async () => {
      if (!profile) return
      const { data: existing } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (existing) {
        setExistingCard(existing)
        setCardData({
          full_name: profile.full_name || 'Member',
          email: profile.email || '',
          nickname: profile.nickname || '',
          avatar_url: profile.avatar_url || '',
          member_id: existing.card_number,
          tier: existing.tier || 'free',
          join_date: existing.issued_at,
        })
      } else {
        // Auto-generate a free card on first load
        const cardNumber = generateCode('HB-', 8)
        const result = await insertRow('membership_cards', {
          user_id: profile.id,
          card_number: cardNumber,
          tier: 'free',
        })
        if (result) {
          setExistingCard(result)
          setCardData({
            full_name: profile.full_name || 'Member',
            email: profile.email || '',
            nickname: profile.nickname || '',
            avatar_url: profile.avatar_url || '',
            member_id: cardNumber,
            tier: 'free',
            join_date: result.issued_at,
          })
        }
      }
    }
    init()
  }, [profile])

  // Draw card on canvas
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !cardData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 1000
    const H = 600
    canvas.width = W
    canvas.height = H

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0a0a0a')
    bgGrad.addColorStop(0.5, '#1a0a0a')
    bgGrad.addColorStop(1, '#0a0a0a')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Red/orange glow stripe
    const stripeGrad = ctx.createLinearGradient(0, 0, W, 0)
    stripeGrad.addColorStop(0, 'rgba(220, 38, 38, 0)')
    stripeGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.15)')
    stripeGrad.addColorStop(1, 'rgba(220, 38, 38, 0)')
    ctx.fillStyle = stripeGrad
    ctx.fillRect(0, 200, W, 200)

    // Border
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.5)'
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, W - 40, H - 40)

    // Inner border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(30, 30, W - 60, H - 60)

    // Club name top
    ctx.fillStyle = '#ea580c'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('HOT BLOOD FC', 60, 70)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.fillText('MEMBERSHIP CARD', 60, 110)

    // Tier badge
    const tierColors: Record<string, string> = {
      free: '#64748b',
      premium: '#f59e0b',
      vip: '#dc2626',
    }
    ctx.fillStyle = tierColors[cardData.tier] || '#64748b'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(cardData.tier.toUpperCase() + ' MEMBER', 60, 140)

    // Member name (big)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 40px Arial'
    ctx.fillText(cardData.full_name.toUpperCase(), 60, 350)

    // Nickname
    if (cardData.nickname) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '20px Arial'
      ctx.fillText('@' + cardData.nickname, 60, 390)
    }

    // Member ID
    ctx.fillStyle = '#ea580c'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('MEMBER ID', 60, 460)
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText(cardData.member_id, 60, 495)

    // Join date
    ctx.fillStyle = '#64748b'
    ctx.font = '14px Arial'
    ctx.fillText('Member since ' + new Date(cardData.join_date).getFullYear(), 60, 540)

    // QR placeholder (simple decorative square pattern)
    const qrX = W - 180
    const qrY = 380
    const qrSize = 120
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20)
    ctx.fillStyle = '#0a0a0a'
    // Draw pseudo-QR pattern based on member ID
    const seed = cardData.member_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const cellSize = qrSize / 12
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        if ((r * 7 + c * 13 + seed) % 3 === 0) {
          ctx.fillRect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize)
        }
      }
    }
    // Corner markers
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(qrX, qrY, cellSize * 3, cellSize * 3)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(qrX + cellSize, qrY + cellSize, cellSize, cellSize)
    ctx.fillStyle = '#dc2626'
    ctx.fillRect(qrX + cellSize + 2, qrY + cellSize + 2, cellSize - 4, cellSize - 4)

    // Logo circle (top right)
    ctx.beginPath()
    ctx.arc(W - 80, 90, 40, 0, Math.PI * 2)
    const logoGrad = ctx.createRadialGradient(W - 80, 90, 0, W - 80, 90, 40)
    logoGrad.addColorStop(0, '#f97316')
    logoGrad.addColorStop(1, '#dc2626')
    ctx.fillStyle = logoGrad
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
    // Logo text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('HB', W - 80, 98)
    ctx.textAlign = 'left'

    // Decorative flame pattern (bottom)
    ctx.fillStyle = 'rgba(234, 88, 12, 0.3)'
    ctx.beginPath()
    ctx.moveTo(60, H - 60)
    ctx.quadraticCurveTo(150, H - 100, 200, H - 60)
    ctx.quadraticCurveTo(250, H - 30, 300, H - 60)
    ctx.quadraticCurveTo(350, H - 90, 400, H - 60)
    ctx.lineTo(400, H - 40)
    ctx.lineTo(60, H - 40)
    ctx.closePath()
    ctx.fill()

    // Motto
    ctx.fillStyle = '#64748b'
    ctx.font = 'italic 12px Arial'
    ctx.fillText('Passion · Power · Victory', W - 300, 200)
  }, [cardData])

  useEffect(() => {
    if (cardData) {
      drawCard()
    }
  }, [cardData, drawCard])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `hotblood-membership-${cardData?.member_id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    show('Card downloaded', 'success')
  }

  if (!cardData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 items-center justify-center shadow-lg mb-3"
        >
          <Crown className="w-7 h-7 text-white" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Your Membership Card</h2>
        <p className="text-slate-500 text-sm">Download and share your official Hot Blood FC card</p>
      </div>

      {/* Canvas preview */}
      <div className="bg-slate-900 rounded-2xl p-4 flex justify-center">
        <canvas
          ref={canvasRef}
          className="w-full max-w-2xl rounded-xl shadow-2xl"
          style={{ aspectRatio: '1000/600' }}
        />
      </div>

      {/* Card info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Member ID</p>
          <p className="font-bold text-slate-900">{cardData.member_id}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Tier</p>
          <p className="font-bold capitalize text-slate-900">{cardData.tier}</p>
        </div>
      </div>

      <Button onClick={handleDownload} icon={Download} size="lg" className="w-full">
        Download Card (PNG)
      </Button>

      {/* Premium upsell */}
      {cardData.tier === 'free' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-5 text-center">
          <div className="inline-flex items-center gap-2 text-yellow-700 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">Upgrade to Premium</span>
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Get a premium card, priority tickets, and exclusive perks.
          </p>
          <Button variant="secondary" size="sm" icon={Crown}>
            Upgrade for KES 500
          </Button>
        </div>
      )}
    </div>
  )
}
