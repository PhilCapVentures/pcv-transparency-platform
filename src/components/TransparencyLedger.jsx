import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { PROJECTS } from '../lib/config'

function donorDisplay(row) {
  if (row.identity_tier === 'anonymous') return 'Anonymous'
  if (row.identity_tier === 'named') return row.first_name || 'Named Donor'
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Verified Donor'
}

function tierBadge(tier) {
  const map = {
    anonymous: { label: 'Anon', bg: 'bg-gray-100', text: 'text-gray-500' },
    named: { label: 'Named', bg: 'bg-blue-50', text: 'text-blue-600' },
    verified: { label: '✓ Verified', bg: 'bg-green-50', text: 'text-green-700' },
  }
  const t = map[tier] || map.anonymous
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${t.bg} ${t.text}`}>
      {t.label}
    </span>
  )
}

function methodIcon(m) {
  return m === 'usdc' ? '🔵' : '💳'
}

function formatAmount(v) {
  return `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export default function TransparencyLedger({ refreshTrigger }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totals, setTotals] = useState({ count: 0, total: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('donations')
      .select('id, created_at, project, amount_usd, payment_method, identity_tier, first_name, last_name, status, transaction_id, mock')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(50)

    if (err) { setError(err.message); setLoading(false); return }

    setRows(data || [])
    const sum = (data || []).reduce((acc, r) => acc + parseFloat(r.amount_usd), 0)
    setTotals({ count: data?.length || 0, total: sum })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load, refreshTrigger])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('donations-ledger')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load])

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: '#6DC138' }}
            />
            Public Transparency Ledger
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">All completed donations — updated in real time</p>
        </div>
        <button
          onClick={load}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer underline"
        >
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Donations', value: totals.count.toLocaleString() },
          { label: 'Total Raised', value: `$${totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          {
            label: 'General Fund',
            value: formatAmount(rows.filter(r => r.project === 'general_fund').reduce((a, r) => a + parseFloat(r.amount_usd), 0)),
          },
          {
            label: 'Disaster Prep',
            value: formatAmount(rows.filter(r => r.project === 'disaster_prep').reduce((a, r) => a + parseFloat(r.amount_usd), 0)),
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="font-bold text-gray-900 text-lg">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (
          <div className="py-12 text-center text-gray-400 text-sm">Loading ledger…</div>
        )}
        {error && (
          <div className="py-12 text-center text-red-500 text-sm">
            Error loading ledger: {error}
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No donations yet. Be the first!</p>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Project</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Donor</th>
                  <th className="text-center py-3 px-4 font-semibold">Pay</th>
                  <th className="text-center py-3 px-4 font-semibold">Mode</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const proj = PROJECTS.find(p => p.id === row.project)
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                    >
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">
                          {proj?.icon} {proj?.name || row.project}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: '#5aaa2e' }}>
                        {formatAmount(row.amount_usd)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{donorDisplay(row)}</span>
                          {tierBadge(row.identity_tier)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span title={row.payment_method}>{methodIcon(row.payment_method)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.mock ? (
                          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">Test</span>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">Live</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3">
        Anonymous donors have no personal information visible. Named donors show first name only.
        Verified donors shown with full name by consent.
      </p>
    </div>
  )
}
