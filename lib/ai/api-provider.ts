import type { InvestigationAssistantRequest, InvestigationAssistantResponse, InvestigationIntelligenceProvider } from './types'
import { validateInvestigationResponse } from './validation'

export function createApiInvestigationProvider(baseUrl: string): InvestigationIntelligenceProvider {
  return {
    async analyzeCase(request: InvestigationAssistantRequest) {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/investigations/analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) throw new Error(`Investigation API returned ${response.status}`)
      const payload: unknown = await response.json()
      return validateInvestigationResponse(payload)
    },
  }
}

export type { InvestigationAssistantResponse }
