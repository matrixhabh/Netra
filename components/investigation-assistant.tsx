'use client'

import { useState } from 'react'
import { Check, LoaderCircle, Send, Sparkles } from 'lucide-react'
import { investigationIntelligence } from '@/lib/ai/client'
import type { InvestigationAssistantResponse, InvestigationLanguage } from '@/lib/ai/types'

type Props = { language: InvestigationLanguage }

export function InvestigationAssistant({ language }: Props) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<InvestigationAssistantResponse | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  async function analyze(message?: string) {
    setStatus('loading')
    try {
      const response = await investigationIntelligence.analyzeCase({
        language,
        caseId: 'C-1042',
        message: message || question || undefined,
        context: { amount: '₹85,000', reportedOn: '02 Sep 2026', assignedTeam: 'Cyber Crime Unit', indicators: ['UPI', 'phishing link'] },
      })
      setResult(response)
      setQuestion('')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const current = result || { summary: 'Initial review prepared for investigator review.', indicators: [{ label: 'Suspicious domain' }, { label: 'Related phone number' }, { label: 'Multiple transactions' }, { label: 'Similar incident pattern' }], leads: ['Review transaction timeline', 'Examine related identifiers', 'Compare linked cases'] }

  return <div className="assistant-panel"><div className="assistant-heading"><span><Sparkles size={16} /> INVESTIGATION ASSISTANT</span><small>Case: C-1042</small></div><p className="mock-summary">{current.summary}</p><h4>Potential indicators</h4>{current.indicators.map((item) => <div className="indicator" key={item.label}><Check size={15} />{item.label}</div>)}<h4 className="leads-title">Suggested investigation leads</h4>{current.leads.map((lead) => <button className="lead" key={lead} onClick={() => analyze(lead)}>{lead} <Send size={13} /></button>)}<div className="assistant-input"><input aria-label="Ask the investigation assistant" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this case" onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) analyze() }} /><button onClick={() => analyze()} disabled={status === 'loading'} aria-label="Analyze question">{status === 'loading' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button></div>{status === 'error' && <p className="assistant-error" role="alert">The assistant is unavailable. Review the case manually or try again.</p>}</div>
}
