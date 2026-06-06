export const ORG = {
  name: 'Philanthro Capital Ventures',
  abbr: 'PCV',
  ein: '41-2684752',
  type: 'Delaware Corporation · Nonprofit Status Pending',
}

export const PROJECTS = [
  {
    id: 'general_fund',
    name: 'General Fund',
    description: 'Support PCV\'s core mission and ongoing programs across all initiatives.',
    icon: '🌱',
  },
  {
    id: 'disaster_prep',
    name: 'Disaster Preparedness Initiative',
    description: 'Fund community disaster preparedness and related public education.',
    icon: '🛡️',
  },
]

export const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

export const IDENTITY_TIERS = [
  {
    id: 'anonymous',
    label: 'Anonymous',
    description: 'No personal information collected. Donation appears as "Anonymous" in the public ledger.',
    fields: [],
  },
  {
    id: 'named',
    label: 'Named',
    description: 'Your first name appears in the ledger. Email used only for your donation receipt.',
    fields: ['first_name', 'email'],
  },
  {
    id: 'verified',
    label: 'Verified',
    description: 'Full identity for IRS tax receipt. Your name appears in the ledger.',
    fields: ['first_name', 'last_name', 'email', 'phone'],
  },
]

// Base mainnet USDC
export const BASE_CHAIN_ID = 8453
export const BASE_CHAIN_ID_HEX = '0x2105'
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export const PCV_WALLET = import.meta.env.VITE_PCV_WALLET || '0x0000000000000000000000000000000000000000'
