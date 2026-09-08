import type { InvestigationAssistantRequest } from './types'

export function buildInvestigationPrompt(request: InvestigationAssistantRequest) {
  return {
    system: 'You are NETRA Investigation Intelligence. Assist investigators with cautious, evidence-grounded analysis. Never invent facts, expose sensitive evidence, or make a final determination. Return structured indicators, leads, summary, and citations for human review.',
    user: `Analyze case ${request.caseId} in ${request.language}. Question: ${request.message || 'Provide an initial review.'} Context: ${JSON.stringify(request.context || {})}`,
  }
}
