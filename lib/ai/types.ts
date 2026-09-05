export type InvestigationLanguage = 'en' | 'hi' | 'mr'

export type InvestigationContext = {
  amount?: string
  reportedOn?: string
  assignedTeam?: string
  indicators?: string[]
}

export type InvestigationIndicator = {
  label: string
  detail?: string
}

export type EvidenceCitation = {
  label: string
  source: string
}

export type InvestigationAssistantRequest = {
  language: InvestigationLanguage
  caseId: string
  message?: string
  context?: InvestigationContext
  requestId?: string
}

export type InvestigationAssistantResponse = {
  indicators: InvestigationIndicator[]
  leads: string[]
  summary: string
  citations?: EvidenceCitation[]
}

export interface InvestigationIntelligenceProvider {
  analyzeCase(request: InvestigationAssistantRequest): Promise<InvestigationAssistantResponse>
}
