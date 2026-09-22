import { createApiInvestigationProvider } from './api-provider'
import { mockInvestigationProvider } from './mock-provider'
import type { InvestigationIntelligenceProvider } from './types'

const mode = process.env.NEXT_PUBLIC_NETRA_AI_MODE || 'demo'
const apiUrl = process.env.NEXT_PUBLIC_NETRA_API_URL

export const investigationIntelligence: InvestigationIntelligenceProvider = mode === 'api' && apiUrl
  ? createApiInvestigationProvider(apiUrl)
  : mockInvestigationProvider
