import { useState } from 'react'
import { PROJECTS, PRESET_AMOUNTS, IDENTITY_TIERS } from '../lib/config'
import PaymentPanel from './PaymentPanel'

const STEPS = ['Project', 'Amount', 'Donor Info', 'Payment']

export default function DonationForm({ mockMode, onSuccess }) {
  const [step, setStep] = useState(0)
  const [project, setProject] = useState(null)
  const [amount, setAmount] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [identityTier, setIdentityTier] = useState('anonymous')
  const [fields, setFields] = useState({ first_name: '', last_name: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})

  const resolvedAmount = amount === 'custom' ? parseFloat(customAmount) : amount

  function setField(key, value) {
    setFields(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  // Pure check — safe to call during render (no setState)
  function isStepValid() {
    if (step === 0) return !!project
    if (step === 1) return resolvedAmount > 0
    if (step === 2) {
      const tier = IDENTITY_TIERS.find(t => t.id === identityTier)
      return tier.fields.every(f => {
        if (!fields[f]?.trim()) return false
        if (f === 'email' && !/\S+@\S+\.\S+/.test(fields[f])) return false
        if (f === 'phone' && !/^\+?[\d\s\-()]{7,}$/.test(fields[f])) return false
        return true
      })
    }
    return true
  }

  // Called on submit — also collects and displays field errors
  function validateAndNext() {
    if (step === 2) {
      const tier = IDENTITY_TIERS.find(t => t.id === identityTier)
      const errs = {}
      for (const f of tier.fields) {
        if (!fields[f]?.trim()) errs[f] = 'Required'
        else if (f === 'email' && !/\S+@\S+\.\S+/.test(fields[f])) errs[f] = 'Invalid email'
        else if (f === 'phone' && !/^\+?[\d\s\-()]{7,}$/.test(fields[f])) errs[f] = 'Invalid phone'
      }
      if (Object.keys(errs).length) { setErrors(errs); return }
    }
    if (!isStepValid()) return
    setStep(s => s + 1)
  }

  function back() { setStep(s => s - 1) }

  function back() { setStep(s => s - 1) }

  const donationData = {
    project,
    amount_usd: resolvedAmount,
    identity_tier: identityTier,
    first_name: fields.first_name || null,
    last_name: fields.last_name || null,
    email: fields.email || null,
    phone: fields.phone || null,
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Step progress */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? 'text-white'
                      : i === step
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={i <= step ? { backgroundColor: '#6DC138' } : {}}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === step ? 'text-gray-800' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mb-5 mx-1 transition-all"
                  style={{ backgroundColor: i < step ? '#6DC138' : '#e5e7eb' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Step 0 — Project */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Choose a project</h2>
            <p className="text-sm text-gray-500 mb-5">Your donation goes directly to your selected initiative.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROJECTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProject(p.id)}
                  className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    project === p.id
                      ? 'border-[#6DC138] bg-[#e8f7de]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{p.icon}</div>
                  <div className="font-semibold text-gray-900 mb-1">{p.name}</div>
                  <div className="text-sm text-gray-500 leading-snug">{p.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Amount */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select an amount</h2>
            <p className="text-sm text-gray-500 mb-5">
              Donating to: <span className="font-medium text-gray-700">
                {PROJECTS.find(p => p.id === project)?.name}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRESET_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(a); setCustomAmount('') }}
                  className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all cursor-pointer ${
                    amount === a
                      ? 'border-[#6DC138] bg-[#e8f7de] text-[#231F20]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ${a.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                min="1"
                placeholder="Other amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmount('custom') }}
                onFocus={() => setAmount('custom')}
                className={`w-full pl-7 pr-4 py-3 rounded-xl border-2 text-sm outline-none transition-all ${
                  amount === 'custom'
                    ? 'border-[#6DC138] bg-[#e8f7de]'
                    : 'border-gray-200 focus:border-[#6DC138]'
                }`}
              />
            </div>
            {resolvedAmount > 0 && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                Donating <span className="font-semibold text-gray-800">${resolvedAmount.toLocaleString()}</span> to {PROJECTS.find(p => p.id === project)?.name}
              </p>
            )}
          </div>
        )}

        {/* Step 2 — Identity */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Donor information</h2>
            <p className="text-sm text-gray-500 mb-5">Choose how you&apos;d like to give.</p>

            <div className="grid gap-2 sm:grid-cols-3 mb-5">
              {IDENTITY_TIERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setIdentityTier(t.id); setErrors({}) }}
                  className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    identityTier === t.id
                      ? 'border-[#6DC138] bg-[#e8f7de]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-900 mb-1">{t.label}</div>
                  <div className="text-xs text-gray-500 leading-snug">{t.description}</div>
                </button>
              ))}
            </div>

            {/* Dynamic fields */}
            {(() => {
              const tier = IDENTITY_TIERS.find(t => t.id === identityTier)
              if (!tier.fields.length) {
                return (
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-xl">
                    No information required for anonymous donations.
                  </div>
                )
              }
              return (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tier.fields.includes('first_name') && (
                    <Field label="First Name" error={errors.first_name} required>
                      <input
                        type="text"
                        value={fields.first_name}
                        onChange={e => setField('first_name', e.target.value)}
                        placeholder="Jane"
                        className={inputClass(errors.first_name)}
                      />
                    </Field>
                  )}
                  {tier.fields.includes('last_name') && (
                    <Field label="Last Name" error={errors.last_name} required>
                      <input
                        type="text"
                        value={fields.last_name}
                        onChange={e => setField('last_name', e.target.value)}
                        placeholder="Smith"
                        className={inputClass(errors.last_name)}
                      />
                    </Field>
                  )}
                  {tier.fields.includes('email') && (
                    <Field label="Email Address" error={errors.email} required>
                      <input
                        type="email"
                        value={fields.email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="jane@example.com"
                        className={inputClass(errors.email)}
                      />
                    </Field>
                  )}
                  {tier.fields.includes('phone') && (
                    <Field label="Phone Number" error={errors.phone} required>
                      <input
                        type="tel"
                        value={fields.phone}
                        onChange={e => setField('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className={inputClass(errors.phone)}
                      />
                    </Field>
                  )}
                </div>
              )
            })()}

            {identityTier === 'verified' && (
              <p className="mt-3 text-xs text-gray-400 flex gap-1.5 items-start">
                <span className="text-[#6DC138] text-base leading-none mt-0.5">🔒</span>
                Your information is used only to generate an IRS-compliant tax receipt and will never be sold.
              </p>
            )}
          </div>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <PaymentPanel
            mockMode={mockMode}
            donationData={donationData}
            onSuccess={onSuccess}
          />
        )}

        {/* Nav buttons */}
        {step < 3 && (
          <div className="mt-6 flex gap-3 justify-between">
            {step > 0 ? (
              <button
                onClick={back}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all cursor-pointer"
              >
                ← Back
              </button>
            ) : <div />}
            <button
              onClick={validateAndNext}
              disabled={!isStepValid()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6DC138' }}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
    error ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[#6DC138] focus:ring-2 focus:ring-[#6DC138]/20'
  }`
}
