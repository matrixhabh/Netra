import type { InvestigationAssistantRequest, InvestigationAssistantResponse, InvestigationIntelligenceProvider } from './types'

const summaries = {
  en: 'Initial review prepared for investigator review.',
  hi: 'जांचकर्ता की समीक्षा के लिए प्रारंभिक समीक्षा तैयार है।',
  mr: 'तपास अधिकाऱ्याच्या पुनरावलोकनासाठी प्राथमिक आढावा तयार आहे.',
}

export const mockInvestigationProvider: InvestigationIntelligenceProvider = {
  async analyzeCase({ caseId, language }: InvestigationAssistantRequest): Promise<InvestigationAssistantResponse> {
    return {
      summary: `${summaries[language]} Case ${caseId}.`,
      indicators: [{ label: 'Suspicious domain' }, { label: 'Related phone number' }, { label: 'Multiple transactions' }, { label: 'Similar incident pattern' }],
      leads: ['Review transaction timeline', 'Examine related identifiers', 'Compare linked cases'],
      citations: [{ label: 'Transaction timeline', source: 'Evidence record E-204' }, { label: 'Related identifier', source: 'Case graph C-1042' }],
    }
  },
}
