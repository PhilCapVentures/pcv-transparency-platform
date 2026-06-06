import { PROJECTS, ORG } from '../lib/config'

export default function SuccessScreen({ result, onReset }) {
  const { donation, txHash, method } = result
  const project = PROJECTS.find(p => p.id === donation.project)
  const date = new Date(donation.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ backgroundColor: '#e8f7de' }}
        >
          ✅
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-500 mb-6">
          Your donation to {ORG.name} has been recorded.
          {donation.mock && <span className="ml-1 text-amber-600 font-medium">(Test donation)</span>}
        </p>

        {/* Receipt card */}
        <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6 text-sm">
          <Row label="Project" value={`${project?.icon} ${project?.name}`} />
          <Row label="Amount" value={`$${parseFloat(donation.amount_usd).toLocaleString()} USD`} />
          <Row label="Date" value={date} />
          <Row
            label="Donor"
            value={
              donation.identity_tier === 'anonymous'
                ? 'Anonymous'
                : donation.identity_tier === 'named'
                ? donation.first_name
                : `${donation.first_name} ${donation.last_name}`
            }
          />
          <Row
            label="Payment"
            value={method === 'card' ? '💳 Card' : '🔵 USDC on Base'}
          />
          {txHash && method === 'usdc' && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Transaction</div>
              <div className="font-mono text-xs text-gray-700 break-all">{txHash}</div>
            </div>
          )}
        </div>

        {donation.identity_tier !== 'anonymous' && donation.email && (
          <p className="text-xs text-gray-400 mb-5">
            A receipt has been sent to <span className="font-medium">{donation.email}</span>.
          </p>
        )}

        {donation.identity_tier === 'verified' && (
          <p className="text-xs text-gray-400 mb-5">
            EIN {ORG.ein} — This donation may be tax-deductible. Consult your tax advisor.
          </p>
        )}

        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all cursor-pointer"
          style={{ backgroundColor: '#6DC138' }}
        >
          Make Another Donation
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Your donation appears in the transparency ledger below.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  )
}
