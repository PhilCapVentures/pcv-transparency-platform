import { useState } from 'react'
import { ethers } from 'ethers'
import { supabase } from '../lib/supabase'
import { PROJECTS, BASE_CHAIN_ID_HEX, USDC_ADDRESS, PCV_WALLET } from '../lib/config'

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

export default function PaymentPanel({ mockMode, donationData, onSuccess }) {
  const [method, setMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Card mock state
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })

  // USDC state
  const [walletAddress, setWalletAddress] = useState(null)
  const [usdcBalance, setUsdcBalance] = useState(null)
  const [txHash, setTxHash] = useState(null)

  const { amount_usd } = donationData
  const projectName = PROJECTS.find(p => p.id === donationData.project)?.name

  async function recordDonation(paymentMethod, transactionId = null) {
    const { data, error } = await supabase.from('donations').insert({
      ...donationData,
      payment_method: paymentMethod,
      status: 'completed',
      transaction_id: transactionId,
      mock: mockMode,
    }).select().single()
    if (error) throw error
    return data
  }

  async function handleCardDonate() {
    setError(null)
    if (!mockMode) {
      setError('Card payments require a server-side integration. Enable Mock Mode to test the flow, or deploy Supabase Edge Functions for real Stripe processing.')
      return
    }
    if (!card.number || !card.expiry || !card.cvc || !card.name) {
      setError('Please fill in all card fields.')
      return
    }
    setProcessing(true)
    try {
      await new Promise(r => setTimeout(r, 1200)) // simulate network
      const mockTxId = `mock_card_${Date.now()}`
      const donation = await recordDonation('card', mockTxId)
      onSuccess({ donation, txHash: mockTxId, method: 'card' })
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function connectWallet() {
    setError(null)
    if (!window.ethereum) {
      setError('MetaMask not found. Please install MetaMask to donate with USDC.')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])

      // Switch to Base
      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: BASE_CHAIN_ID_HEX }])
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await provider.send('wallet_addEthereumChain', [{
            chainId: BASE_CHAIN_ID_HEX,
            chainName: 'Base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          }])
        } else throw switchErr
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)

      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      const bal = await usdc.balanceOf(address)
      const dec = await usdc.decimals()
      setUsdcBalance(parseFloat(ethers.formatUnits(bal, dec)).toFixed(2))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUSDCSend() {
    setError(null)
    if (mockMode) {
      setProcessing(true)
      try {
        await new Promise(r => setTimeout(r, 1500))
        const mockHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        setTxHash(mockHash)
        const donation = await recordDonation('usdc', mockHash)
        onSuccess({ donation, txHash: mockHash, method: 'usdc' })
      } catch (err) {
        setError(err.message)
      } finally {
        setProcessing(false)
      }
      return
    }

    if (!window.ethereum || !walletAddress) {
      setError('Connect your wallet first.')
      return
    }
    if (PCV_WALLET === '0x0000000000000000000000000000000000000000') {
      setError('PCV wallet address not configured. Set VITE_PCV_WALLET in .env.local.')
      return
    }

    setProcessing(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      const decimals = await usdc.decimals()
      const amountWei = ethers.parseUnits(amount_usd.toString(), decimals)

      const tx = await usdc.transfer(PCV_WALLET, amountWei)
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      if (!receipt.status) throw new Error('Transaction reverted')

      const donation = await recordDonation('usdc', tx.hash)
      onSuccess({ donation, txHash: tx.hash, method: 'usdc' })
    } catch (err) {
      setError(err.reason || err.message)
    } finally {
      setProcessing(false)
    }
  }

  function formatCard(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Payment</h2>
      <p className="text-sm text-gray-500 mb-5">
        Donating <span className="font-semibold text-gray-800">${amount_usd?.toLocaleString()}</span> to {projectName}
      </p>

      {/* Method tabs */}
      <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'card', label: '💳 Credit / Debit Card' },
          { id: 'usdc', label: '🔵 USDC on Base' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setMethod(m.id); setError(null) }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              method === m.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Card form */}
      {method === 'card' && (
        <div className="space-y-3">
          {mockMode && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3">
              Mock mode: any card details will be accepted.
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name on Card</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={card.name}
              onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#6DC138] focus:ring-2 focus:ring-[#6DC138]/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Card Number</label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
              maxLength={19}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#6DC138] focus:ring-2 focus:ring-[#6DC138]/20 transition-all font-mono tracking-wider"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={card.expiry}
                onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                maxLength={5}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#6DC138] focus:ring-2 focus:ring-[#6DC138]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CVC</label>
              <input
                type="text"
                placeholder="123"
                value={card.cvc}
                onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#6DC138] focus:ring-2 focus:ring-[#6DC138]/20 transition-all"
              />
            </div>
          </div>

          {error && <ErrorBox message={error} />}

          <DonateButton
            onClick={handleCardDonate}
            loading={processing}
            label={`Donate $${amount_usd?.toLocaleString()}`}
          />
        </div>
      )}

      {/* USDC form */}
      {method === 'usdc' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <div className="font-semibold text-blue-900 mb-1">Donating {amount_usd} USDC on Base</div>
            <div className="text-blue-700 text-xs">
              Make sure your wallet is on the Base network and has sufficient USDC.
            </div>
          </div>

          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="w-full py-3 rounded-xl border-2 border-blue-300 bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🦊</span> Connect MetaMask Wallet
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Wallet</span>
                <span className="font-mono text-xs text-gray-700">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              </div>
              {usdcBalance !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">USDC Balance</span>
                  <span className={`font-semibold ${parseFloat(usdcBalance) >= amount_usd ? 'text-green-600' : 'text-red-500'}`}>
                    {usdcBalance} USDC
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sending to</span>
                <span className="font-mono text-xs text-gray-700">
                  {mockMode ? 'Mock address' : `${PCV_WALLET.slice(0, 6)}…${PCV_WALLET.slice(-4)}`}
                </span>
              </div>
            </div>
          )}

          {txHash && (
            <div className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg p-3">
              Transaction submitted: <span className="font-mono break-all">{txHash.slice(0, 20)}…</span>
            </div>
          )}

          {error && <ErrorBox message={error} />}

          {(walletAddress || mockMode) && (
            <DonateButton
              onClick={handleUSDCSend}
              loading={processing}
              label={`Send ${amount_usd} USDC`}
              disabled={!mockMode && usdcBalance !== null && parseFloat(usdcBalance) < amount_usd}
            />
          )}
        </div>
      )}

      {/* Trust signals */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-400">
        <span>🔒 Secure & Encrypted</span>
        <span>·</span>
        <span>501(c) Nonprofit</span>
        <span>·</span>
        <span>Tax-Deductible</span>
      </div>
    </div>
  )
}

function DonateButton({ onClick, loading, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{ backgroundColor: '#6DC138' }}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing…
        </>
      ) : label}
    </button>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
      {message}
    </div>
  )
}
