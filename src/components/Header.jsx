import { ORG } from '../lib/config'
import pcvLogo from '../assets/pcv-logo-transparent.png'

export default function Header({ mockMode, onToggleMock }) {
  return (
    <header style={{ backgroundColor: '#231F20' }} className="text-white shadow-lg">
      {mockMode && (
        <div className="bg-amber-500 text-amber-950 text-center text-xs font-semibold py-1.5 px-4 tracking-wide uppercase">
          ⚠ Test Mode — No real payments processed
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl px-6 py-3">
            <img src={pcvLogo} alt={ORG.name} className="h-[140px] w-auto" />
          </div>
          <div className="text-xs text-gray-400 hidden sm:block">
            EIN {ORG.ein} &middot; {ORG.type}
          </div>
        </div>

        <button
          onClick={onToggleMock}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
            mockMode
              ? 'border-amber-500 text-amber-400 hover:bg-amber-500/10'
              : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${mockMode ? 'bg-amber-400' : 'bg-gray-600'}`}
          />
          {mockMode ? 'Mock On' : 'Mock Off'}
        </button>
      </div>
    </header>
  )
}
