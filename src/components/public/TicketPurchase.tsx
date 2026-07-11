// =============================================
// HOT BLOOD FC — Ticket Purchase
// Quantity selector, donation add-on, unique codes, 24hr validity
// =============================================

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ticket as TicketIcon, Minus, Plus, Heart, Check, Phone,
  Gift, Calendar, MapPin, Clock, QrCode,
} from 'lucide-react'
import { supabase } from '../../helpers/supabase'
import { insertRow, generateCode, getCurrentUser } from '../../helpers/api'
import { useToast, Modal, Button } from '../ui/Toast'
import type { Match } from '../../types'

const PRICE_PER_TICKET = 200

export default function TicketPurchase({
  match,
  onClose,
}: {
  match: Match
  onClose: () => void
}) {
  const { show } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [addDonation, setAddDonation] = useState(false)
  const [donationAmount, setDonationAmount] = useState(100)
  const [phone, setPhone] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [ticketCode, setTicketCode] = useState('')

  const ticketTotal = useMemo(() => quantity * PRICE_PER_TICKET, [quantity])
  const grandTotal = ticketTotal + (addDonation ? donationAmount : 0)

  const handlePurchase = async () => {
    if (!phone || phone.length < 10) {
      show('Enter a valid phone number', 'error')
      return
    }
    setProcessing(true)
    const { profile } = await getCurrentUser()
    if (!profile) {
      show('Please log in to purchase tickets', 'error')
      setProcessing(false)
      return
    }

    const code = generateCode('TKT-', 8)
    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + 24)

    const result = await insertRow<any>('tickets', {
      match_id: match.id,
      buyer_id: profile.id,
      ticket_code: code,
      qr_code_url: null,
      price: PRICE_PER_TICKET,
      total_price: grandTotal,
      is_donation_ticket: addDonation,
      quantity,
      status: 'active',
      valid_until: validUntil.toISOString(),
      payment_method: 'mpesa',
      payment_reference: `PAY-${Date.now()}`,
    })

    // Record as transaction
    if (result) {
      await supabase.from('transactions').insert({
        type: 'ticket_sale',
        amount: grandTotal,
        description: `${quantity} ticket(s) vs ${match.opponent}`,
        payment_method: 'mpesa',
        reference_code: code,
      })

      // Add donation if selected
      if (addDonation) {
        await insertRow('donations', {
          user_id: profile.id,
          donor_name: profile.full_name || 'Anonymous',
          amount: donationAmount,
          message: 'Ticket donation add-on',
          payment_method: 'mpesa',
          payment_reference: `DON-${Date.now()}`,
          status: 'completed',
        })
      }

      // Create notification
      await insertRow('notifications', {
        user_id: profile.id,
        title: 'Ticket Purchased',
        message: `Your ticket code is ${code}. Valid for 24 hours.`,
        type: 'ticket_confirmation',
        is_read: false,
      })

      setTicketCode(code)
      setProcessing(false)
      setSuccessOpen(true)
    } else {
      show('Failed to process purchase', 'error')
      setProcessing(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Purchase Tickets" size="md">
      <div className="space-y-5">
        {/* Match info */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-lg">vs {match.opponent}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {match.venue || 'TBD'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {match.match_time || 'TBA'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <TicketIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Number of Tickets</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-black text-white">{quantity}</span>
              <p className="text-xs text-slate-400">KES {PRICE_PER_TICKET} each</p>
            </div>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
              className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Maximum 10 tickets per purchase</p>
        </div>

        {/* Donation add-on */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={addDonation}
              onChange={(e) => setAddDonation(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-white text-sm">Add a donation</span>
              </div>
              <p className="text-xs text-slate-400">Support the team with an extra contribution</p>
            </div>
          </label>
          {addDonation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 flex gap-2"
            >
              {[50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDonationAmount(amt)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    donationAmount === amt
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">M-Pesa Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="254712345678"
              className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:border-orange-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Price summary */}
        <div className="space-y-2 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{quantity} ticket{quantity > 1 ? 's' : ''} × KES {PRICE_PER_TICKET}</span>
            <span className="text-white font-semibold">KES {ticketTotal.toLocaleString()}</span>
          </div>
          {addDonation && (
            <div className="flex justify-between text-sm">
              <span className="text-purple-400 flex items-center gap-1">
                <Heart className="w-3 h-3" /> Donation
              </span>
              <span className="text-white font-semibold">KES {donationAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span className="text-white font-bold">Total</span>
            <span className="text-2xl font-black text-orange-400">KES {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        <Button onClick={handlePurchase} loading={processing} className="w-full" size="lg" icon={TicketIcon}>
          {processing ? 'Processing...' : `Pay KES ${grandTotal.toLocaleString()}`}
        </Button>
      </div>

      {/* Success modal */}
      <Modal isOpen={successOpen} onClose={() => { setSuccessOpen(false); onClose() }} title="Purchase Successful" size="sm">
        <div className="text-center space-y-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
          >
            <Check className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Tickets Confirmed!</h3>
            <p className="text-sm text-slate-500 mt-1">Your ticket code is ready. Valid for 24 hours.</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-center mb-3">
              <QrCode className="w-16 h-16 text-orange-400" />
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Ticket Code</p>
            <p className="text-2xl font-black text-white tracking-wider">{ticketCode}</p>
            <p className="text-xs text-slate-500 mt-2">
              Quantity: {quantity} · Total: KES {grandTotal.toLocaleString()}
            </p>
            <p className="text-xs text-orange-400 mt-1">
              Valid until {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-GB')}
            </p>
          </div>
          <Button onClick={() => { setSuccessOpen(false); onClose() }} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </Modal>
  )
}
