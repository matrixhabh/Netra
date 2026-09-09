import type { FirAskResponse, FirDocumentAnalysis } from './fir-types'

export type FirAnalyzeResult = { analysis: FirDocumentAnalysis; documentText: string }

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json()
    if (payload && typeof payload.error === 'string') return payload.error
  } catch {
    // ignore parse errors, use fallback
  }
  return fallback
}

export async function analyzeFirPdf(file: File, signal?: AbortSignal): Promise<FirAnalyzeResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/fir/analyze', { method: 'POST', body: formData, signal })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to analyze the document.'))
  }
  return response.json()
}

export async function askFirQuestion(params: {
  question: string
  documentText: string
  analysis: FirDocumentAnalysis
  history?: { question: string; answer: string }[]
  language?: 'en' | 'hi' | 'mr'
}): Promise<FirAskResponse> {
  const response = await fetch('/api/fir/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to answer the question.'))
  }
  return response.json()
}
