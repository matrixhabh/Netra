import { callGemini, callGroq, areFirLlmsConfigured } from './llm-server'
import type { FirAskRequest, FirAskResponse } from './fir-types'
import { buildFirAskPrompt, buildFirVerifyPrompt } from './fir-prompts'
import { safeParseJson, validateAskPayload } from './fir-validation'
import { heuristicAsk } from './fir-heuristic'

const MAX_CONTEXT_CHARS = 60_000

function trimDocumentForContext(documentText: string, question: string): string {
  if (documentText.length <= MAX_CONTEXT_CHARS) return documentText
  const paragraphs = documentText.split(/\n{2,}/)
  const questionWords = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2)
  const scored = paragraphs.map((paragraph, index) => ({ paragraph, index, score: questionWords.reduce((total, word) => total + (paragraph.toLowerCase().includes(word) ? 1 : 0), 0) }))
  scored.sort((a, b) => b.score - a.score)
  const picked = new Set<number>()
  let charBudget = MAX_CONTEXT_CHARS
  for (const item of scored) {
    if (charBudget <= 0) break
    if (item.score === 0 && picked.size > 0) continue
    picked.add(item.index)
    charBudget -= item.paragraph.length
  }
  return paragraphs.filter((_, index) => picked.has(index)).join('\n\n')
}

export async function answerFirQuestion(request: FirAskRequest): Promise<FirAskResponse> {
  if (!areFirLlmsConfigured()) return heuristicAsk(request.question, request.documentText)

  const trimmedRequest: FirAskRequest = { ...request, documentText: trimDocumentForContext(request.documentText, request.question) }
  try {
    // Groq produces the fast grounded draft.
    const { system, user } = buildFirAskPrompt(trimmedRequest)
    const draftRaw = await callGroq({ system, user, maxTokens: 1400 })
    const draft = validateAskPayload(safeParseJson(draftRaw))

    // Gemini is the second-pass verifier: it can correct unsupported claims and citations.
    const verify = buildFirVerifyPrompt(trimmedRequest, draft)
    const verifiedRaw = await callGemini({ system: verify.system, user: verify.user, maxOutputTokens: 1600 })
    return validateAskPayload(safeParseJson(verifiedRaw))
  } catch {
    return heuristicAsk(request.question, request.documentText)
  }
}
