// =============================================
// HOT BLOOD FC — Donation Page
// Public donations: preset + custom amounts, M-Pesa flow, leaderboard
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Gift, Trophy, Send, Phone, Check, Crown, Sparkles,
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { fetchAll, insertRow, getCurrentUser } from '../../helpers/api'
import { useToast, Modal, Button, Skeleton } from '../ui/Toast'
import type { Donation } from '../../types'

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]

export default function DonationPage() {
  const { show } = useToast()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [donorName, setDonorName] = useState('')
  const [phone, setPhone] = useState('')
  const [paying, setPaying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const FUNDRAISING_GOAL = 500000 // KES

  const fetchDonations = useCallback(async () => {
    const data = await fetchAll<Donation>('donations', {
      eq: { status: 'completed' },
      order: { column: 'created_at' },
    })
    setDonations(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDonations()
    getCurrentUser().then(({ profile }) => {
      if (profile) {
        setUser(profile)
        setDonorName(profile.full_name || profile.nickname || '')
      }
    })
  }, [fetchDonations])

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount || 0

  const stats = useMemo(() => {
    const total = donations.reduce((s, d) => s + Number(d.amount), 0)
    const count = donations.length
    const progress = Math.min((total / FUNDRAISING_GOAL) * 100, 100)
    return { total, count, progress }
  }, [donations])

  // Top donors (aggregated by name)
  const topDonors = useMemo(() => {
    const map: Record<string, number> = {}
    donations.forEach((d) => {
      const name = d.donor_name || 'Anonymous'
      map[name] = (map[name] || 0) + Number(d.amount)
    })
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [donations])

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (finalAmount < 10) {
      show('Minimum donation is KES 10', 'error')
      return
    }
    if (!phone || phone.length < 10) {
      show('Enter a valid phone number', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const confirmPayment = async () => {
    setPaying(true)
    // Insert donation record
    const result = await insertRow<Donation>('donations', {
      user_id: user?.id || null,
      donor_name: donorName || 'Anonymous',
      amount: finalAmount,
      message: message || null,
      payment_method: 'mpesa',
      payment_reference: `DON-${Date.now()}`,
      status: 'completed',
    })

    // Also record as a transaction for finance tracking
    if (result) {
      await supabase.from('transactions').insert({
        type: 'donation',
        amount: finalAmount,
        description: `Donation from ${donorName || 'Anonymous'}`,
        payment_method: 'mpesa',
        reference_code: `DON-${Date.now()}`,
      })
    }

    setPaying(false)
    setConfirmOpen(false)
    if (result) {
      show('Thank you for your donation!', 'success')
      // Reset
      setMessage('')
      setCustomAmount('')
      setSelectedAmount(500)
      fetchDonations()
    } else {
      show('Donation failed. Please try again.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 items-center justify-center shadow-lg shadow-purple-500/30 mb-4"
        >
          <Heart className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
          Support <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Hot Blood FC</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base">
          Your contribution fuels the team — kits, transport, training gear, and grassroots development.
        </p>
      </div>

      {/* Fundraising progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-sm text-slate-500">Raised so far</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">KES {stats.total.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Goal</p>
            <p className="text-lg font-bold text-slate-700">KES {FUNDRAISING_GOAL.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {stats.count} donations · {stats.progress.toFixed(0)}% of goal
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donation form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Make a Donation</h2>
          <form onSubmit={handleDonate} className="space-y-4">
            {/* Preset amounts */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Choose Amount (KES)</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt)
                      setCustomAmount('')
                    }}
                    className={`py-3 rounded-xl border-2 font-bold transition-all ${
                      selectedAmount === amt && !customAmount
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Or Custom Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">KES</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value)
                    setSelectedAmount(null)
                  }}
                  min="10"
                  placeholder="Enter amount"
                  className="w-full pl-14 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Donor name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Your Name</label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Anonymous Fan"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">M-Pesa Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="254712345678"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                maxLength={200}
                placeholder="Leave a word of support..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              />
            </div>

            {/* Summary + submit */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-500">You're donating</span>
                <span className="text-2xl font-black text-purple-600">KES {finalAmount.toLocaleString()}</span>
              </div>
              <Button type="submit" className="w-full" size="lg" icon={Heart}>
                Donate Now
              </Button>
            </div>
          </form>
        </div>

        {/* Top donors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" /> Top Supporters
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : topDonors.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Be the first to donate!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {topDonors.map((donor, idx) => (
                  <motion.div
                    key={donor.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      idx === 0
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      idx === 0 ? 'bg-yellow-500 text-white' :
                      idx === 1 ? 'bg-slate-400 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="flex-1 font-semibold text-slate-800 truncate">{donor.name}</span>
                    <span className="font-bold text-purple-600 text-sm">KES {donor.amount.toLocaleString()}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Recent messages */}
      {donations.filter((d) => d.message).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Messages of Support</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {donations
              .filter((d) => d.message)
              .slice(-6)
              .reverse()
              .map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-700 italic">"{d.message}"</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600">— {d.donor_name || 'Anonymous'}</p>
                    <p className="text-xs text-purple-600 font-bold">KES {Number(d.amount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confirm payment modal */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Donation" size="sm">
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-slate-900">KES {finalAmount.toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">to Hot Blood FC</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-semibold text-slate-800">{donorName || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="font-semibold text-slate-800">{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method</span>
              <span className="font-semibold text-slate-800">M-Pesa</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmPayment} loading={paying} className="flex-1" icon={Check}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
