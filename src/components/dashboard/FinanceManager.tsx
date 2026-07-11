// =============================================
// HOT BLOOD FC — Finance Manager
// Transactions, charts, manual recording, donations
// =============================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Receipt, Download,
  Gift, Ticket as TicketIcon, ShoppingBag, Wallet,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format, eachDayOfInterval, addDays } from 'date-fns'
import { supabase } from '../../helpers/supabase'
import { fetchAll, insertRow } from '../../helpers/api'
import { useToast, Modal, Button, Skeleton } from '../ui/Toast'
import type { Transaction, Donation } from '../../types'

const TYPE_LABELS: Record<string, string> = {
  ticket_sale: 'Ticket Sale',
  merchandise: 'Merchandise',
  donation: 'Donation',
  membership: 'Membership',
  expense: 'Expense',
  other: 'Other',
}

const TYPE_COLORS: Record<string, string> = {
  ticket_sale: '#f97316',
  merchandise: '#3b82f6',
  donation: '#10b981',
  membership: '#a855f7',
  expense: '#ef4444',
  other: '#64748b',
}

export default function FinanceManager() {
  const { show } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const [form, setForm] = useState({
    type: 'donation' as 'ticket_sale' | 'merchandise' | 'donation' | 'membership' | 'expense' | 'other',
    amount: '',
    description: '',
    payment_method: 'mpesa' as 'mpesa' | 'bank' | 'airtel' | 'cash' | 'other',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [txns, dons] = await Promise.all([
      fetchAll<Transaction>('transactions', {
        order: { column: 'created_at' },
        limit: 200,
      }),
      fetchAll<Donation>('donations', { order: { column: 'created_at' } }),
    ])
    setTransactions(txns)
    setDonations(dons)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type !== 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const donationsTotal = donations
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + Number(d.amount), 0)
    return {
      income,
      expenses,
      net: income - expenses,
      donationsTotal,
      donationCount: donations.filter((d) => d.status === 'completed').length,
    }
  }, [transactions, donations])

  // Revenue chart data (last 30 days)
  const revenueData = useMemo(() => {
    const days = eachDayOfInterval({ start: addDays(new Date(), -29), end: new Date() })
    return days.map((day) => {
      const dayTxns = transactions.filter(
        (t) => format(new Date(t.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      )
      return {
        name: format(day, 'MMM dd'),
        income: dayTxns.filter((t) => t.type !== 'expense').reduce((s, t) => s + Number(t.amount), 0),
        expenses: dayTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
  }, [transactions])

  // Pie data by type
  const pieData = useMemo(() => {
    const types = ['ticket_sale', 'merchandise', 'donation', 'membership']
    return types
      .map((type) => ({
        name: TYPE_LABELS[type],
        value: transactions
          .filter((t) => t.type === type)
          .reduce((sum, t) => sum + Number(t.amount), 0),
        color: TYPE_COLORS[type],
      }))
      .filter((d) => d.value > 0)
  }, [transactions])

  const filteredTxns = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((t) => t.type === filter)
  }, [transactions, filter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      show('Enter a valid amount', 'error')
      return
    }
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const result = await insertRow<Transaction>('transactions', {
      type: form.type,
      amount,
      description: form.description,
      payment_method: form.payment_method,
      reference_code: `MAN-${Date.now()}`,
      recorded_by: user?.id || null,
    })

    if (result) {
      show('Transaction recorded', 'success')
      setModalOpen(false)
      setForm({ type: 'donation', amount: '', description: '', payment_method: 'mpesa' })
      fetchData()
    } else {
      show('Failed to record transaction', 'error')
    }
    setSaving(false)
  }

  const exportCSV = () => {
    const headers = ['Date,Type,Amount,Description,Payment Method,Reference']
    const rows = transactions.map((t) =>
      [
        new Date(t.created_at).toLocaleDateString(),
        TYPE_LABELS[t.type] || t.type,
        Number(t.amount),
        `"${t.description}"`,
        t.payment_method,
        t.reference_code || '',
      ].join(',')
    )
    const csv = [...headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hotblood-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    show('Report exported', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-1">
            Finance <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Management</span>
          </h2>
          <p className="text-slate-400 text-sm">Track revenue, expenses, and donations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportCSV} icon={Download} size="md">
            Export
          </Button>
          <Button onClick={() => setModalOpen(true)} icon={Plus} size="md">
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue', value: stats.income, icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
          { label: 'Expenses', value: stats.expenses, icon: TrendingDown, color: 'from-red-500 to-orange-600' },
          { label: 'Net Balance', value: stats.net, icon: Wallet, color: 'from-blue-500 to-cyan-600' },
          { label: 'Donations', value: stats.donationsTotal, icon: Gift, color: 'from-purple-500 to-pink-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-5"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
            <p className="text-xl sm:text-2xl font-black text-white">
              KES {Number(stat.value).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Trend (30 Days)</h3>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} interval={4} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Revenue by Type</h3>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    formatter={(value: number) => `KES ${value.toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <DollarSign className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Donations section */}
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 sm:p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-400" /> Recent Donations
        </h3>
        {donations.filter((d) => d.status === 'completed').length > 0 ? (
          <div className="space-y-2">
            {donations
              .filter((d) => d.status === 'completed')
              .slice(0, 5)
              .map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{d.donor_name || 'Anonymous'}</p>
                      {d.message && <p className="text-xs text-slate-400 truncate max-w-xs">{d.message}</p>}
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">
                    +KES {Number(d.amount).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4 text-center">No donations received yet</p>
        )}
      </div>

      {/* Transactions table */}
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-lg font-bold text-white">Transaction History</h3>
            <div className="flex gap-2 flex-wrap">
              {['all', 'ticket_sale', 'merchandise', 'donation', 'expense'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filter === f
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'All' : TYPE_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: cards / Desktop: table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Method</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTxns.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-3 text-sm text-slate-400">
                        {format(new Date(t.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${TYPE_COLORS[t.type]}20`,
                            color: TYPE_COLORS[t.type],
                          }}
                        >
                          {TYPE_LABELS[t.type] || t.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-white max-w-xs truncate">{t.description || '-'}</td>
                      <td className="px-6 py-3 text-sm text-slate-400 capitalize">{t.payment_method}</td>
                      <td className={`px-6 py-3 text-right font-bold ${t.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {t.type === 'expense' ? '-' : '+'}KES {Number(t.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-800">
              {filteredTxns.slice(0, 30).map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${TYPE_COLORS[t.type]}20`, color: TYPE_COLORS[t.type] }}
                    >
                      {TYPE_LABELS[t.type] || t.type}
                    </span>
                    <span className={`font-bold text-sm ${t.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {t.type === 'expense' ? '-' : '+'}KES {Number(t.amount).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white truncate">{t.description || '-'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(t.created_at), 'MMM dd, yyyy')} · {t.payment_method}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Transaction" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="ticket_sale">Ticket Sale (Income)</option>
              <option value="merchandise">Merchandise (Income)</option>
              <option value="donation">Donation (Income)</option>
              <option value="membership">Membership (Income)</option>
              <option value="expense">Expense</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Amount (KES) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              min="1"
              step="0.01"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
              placeholder="e.g., 3 tickets vs Chuka United"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as any })}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="mpesa">M-Pesa</option>
              <option value="airtel">Airtel Money</option>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
