import type { EvidenceCitation, InvestigationAssistantResponse, InvestigationIndicator } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function validateInvestigationResponse(value: unknown): InvestigationAssistantResponse {
  if (!isRecord(value) || typeof value.summary !== 'string' || !Array.isArray(value.indicators) || !Array.isArray(value.leads)) {
    throw new Error('Investigation response failed schema validation')
  }
  const indicators: InvestigationIndicator[] = value.indicators.filter(isRecord).filter((item) => typeof item.label === 'string').map((item) => ({ label: item.label as string, detail: typeof item.detail === 'string' ? item.detail : undefined }))
  const leads = value.leads.filter((item): item is string => typeof item === 'string')
  const citations: EvidenceCitation[] | undefined = Array.isArray(value.citations) ? value.citations.filter(isRecord).filter((item) => typeof item.label === 'string' && typeof item.source === 'string').map((item) => ({ label: item.label as string, source: item.source as string })) : undefined
  return { summary: value.summary, indicators, leads, citations }
}
