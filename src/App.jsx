import { useState } from 'react'
import Header from './components/Header'
import DonationForm from './components/DonationForm'
import SuccessScreen from './components/SuccessScreen'
import TransparencyLedger from './components/TransparencyLedger'
import { ORG } from './lib/config'

export default function App() {
  const [mockMode, setMockMode] = useState(true)
  const [result, setResult] = useState(null)
  const [ledgerRefresh, setLedgerRefresh] = useState(0)

  function handleSuccess(res) {
    setResult(res)
    setLedgerRefresh(n => n + 1)
  }

  function handleReset() {
    setResult(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Header mockMode={mockMode} onToggleMock={() => setMockMode(m => !m)} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#231F20' }}>
            Make a Difference Today
          </h1>
          <p className="text-gray-500">
            100% of your donation goes directly to your chosen initiative.
            <br />{ORG.name} is a Delaware corporation with<br />nonprofit status pending (EIN {ORG.ein}).
          </p>
        </div>

        {/* Donation form or success */}
        {result ? (
          <SuccessScreen result={result} onReset={handleReset} />
        ) : (
          <DonationForm mockMode={mockMode} onSuccess={handleSuccess} />
        )}

        {/* Transparency ledger */}
        <TransparencyLedger refreshTrigger={ledgerRefresh} />

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-400 pb-8 space-y-1">
          <p>{ORG.name} &middot; EIN {ORG.ein} &middot; {ORG.type}</p>
          <p>Donations may be tax-deductible. Consult your tax advisor.</p>
        </footer>
      </main>
    </div>
  )
}
