import type { FirAskRequest, FirDocumentAnalysis } from './fir-types'

const EXTRACTION_SYSTEM = `You are NETRA's document intelligence engine for police First Information Reports (FIRs) and related case documents.
You read the OCR/extracted text of a document (or a page range of a longer document) and return a single, strict JSON object — nothing else, no markdown fences, no commentary.
Ground every field only in the supplied text. Never invent names, dates, sections of law, or relationships that are not stated or clearly implied by the text.
If a field is unknown, omit it or use an empty array/string. Prefer precision over completeness.
Every entity, relationship, and timeline event must be traceable to the supplied text.`

function extractionSchema() {
  return `Return JSON with exactly this shape:
{
  "documentType": string,               // e.g. "First Information Report", "Witness statement", "Charge sheet excerpt", "Unclassified document"
  "summary": string,                    // 2-4 sentence plain-language summary of THIS excerpt
  "keyFacts": {
    "firNumber": string?,
    "policeStation": string?,
    "district": string?,
    "actsAndSections": string[]?,       // e.g. ["Section 354 IPC", "Section 506 IPC"]
    "dateOfReport": string?,
    "dateOfIncident": string?,
    "placeOfIncident": string?,
    "complainant": string?,
    "investigatingOfficer": string?
  },
  "entities": [
    {
      "type": "person" | "organization" | "location" | "phone" | "email" | "vehicle" | "identifier" | "weapon" | "date" | "other",
      "name": string,
      "role": string?,                  // e.g. "Complainant", "Accused", "Witness", "Investigating Officer", "Victim"
      "attributes": string[]?,          // short facts about the entity, e.g. "son of Suresh Kumar", "resident of MG Road"
      "confidence": "High" | "Medium" | "Low"
    }
  ],
  "relationships": [
    {
      "source": string,                 // entity name
      "target": string,                 // entity name
      "relation": string,               // short label, e.g. "accused of assaulting", "father of", "witnessed by"
      "description": string,            // one sentence, plain language
      "evidence": string?,              // short supporting phrase copied from the text (under 15 words)
      "confidence": "High" | "Medium" | "Low"
    }
  ],
  "timeline": [
    {
      "date": string?,
      "time": string?,
      "description": string,
      "relatedEntities": string[]
    }
  ]
}`
}

export function buildFirExtractionPrompt(chunkText: string, opts: { chunkIndex: number; chunkCount: number; pageRange: string }) {
  const positionNote =
    opts.chunkCount > 1
      ? `This is excerpt ${opts.chunkIndex + 1} of ${opts.chunkCount} from the same document, covering ${opts.pageRange}. Only extract what is present in THIS excerpt — another pass will merge all excerpts.`
      : `This excerpt covers ${opts.pageRange} and is the entire document.`

  return {
    system: `${EXTRACTION_SYSTEM}\n\n${extractionSchema()}`,
    user: `${positionNote}\n\n--- DOCUMENT TEXT START ---\n${chunkText}\n--- DOCUMENT TEXT END ---`,
  }
}

export function buildFirSynthesisPrompt(fileName: string, partialSummaries: string[], mergedKeyFactsHint: string) {
  return {
    system: `You are NETRA's document intelligence engine. You are given per-section summaries and key facts already extracted from a single document called "${fileName}". Merge them into one coherent overview. Return strict JSON only, no markdown fences: { "documentType": string, "summary": string } where summary is 3-6 sentences covering the whole document.`,
    user: `Section summaries in reading order:\n${partialSummaries.map((s, i) => `(${i + 1}) ${s}`).join('\n')}\n\nAlready-merged key facts for reference: ${mergedKeyFactsHint}`,
  }
}

const ASK_SYSTEM = `You are NETRA's investigation assistant answering an officer's question about a specific uploaded case document (an FIR or related record).
Answer ONLY using the provided document text and the pre-extracted structured analysis. Never use outside knowledge about real people, places, or cases.
If the document does not contain the answer, say so plainly instead of guessing.
Be precise about dates, times, sections of law, and the connection between people or entities when asked about links or relationships.
Return a single strict JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "answer": string,                      // direct, complete answer in plain language
  "citations": [ { "quote": string, "location": string? } ],  // short exact phrases from the document text that support the answer, with a page reference like "Page 2" when available
  "relatedEntities": string[],           // names of people/entities the answer concerns
  "confidence": "High" | "Medium" | "Low"
}`

export function buildFirAskPrompt(request: FirAskRequest) {
  const historyBlock = request.history?.length
    ? `Prior questions in this session (for context only):\n${request.history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join('\n')}\n\n`
    : ''

  const analysisBlock = summarizeAnalysisForPrompt(request.analysis)

  return {
    system: ASK_SYSTEM,
    user: `${historyBlock}Pre-extracted structured analysis:\n${analysisBlock}\n\n--- DOCUMENT TEXT START ---\n${request.documentText}\n--- DOCUMENT TEXT END ---\n\nOfficer's question: ${request.question}`,
  }
}

export function summarizeAnalysisForPrompt(analysis: FirDocumentAnalysis) {
  const entities = analysis.entities.map((e) => `- ${e.name} (${e.type}${e.role ? `, ${e.role}` : ''})${e.attributes.length ? `: ${e.attributes.join('; ')}` : ''}`).join('\n')
  const relationships = analysis.relationships.map((r) => `- ${r.source} -> ${r.target}: ${r.relation} (${r.description})`).join('\n')
  const timeline = analysis.timeline.map((t) => `- ${[t.date, t.time].filter(Boolean).join(' ')}: ${t.description}`).join('\n')
  return [
    `Summary: ${analysis.summary}`,
    `Key facts: ${JSON.stringify(analysis.keyFacts)}`,
    entities ? `Entities:\n${entities}` : '',
    relationships ? `Relationships:\n${relationships}` : '',
    timeline ? `Timeline:\n${timeline}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}


export function buildFirVerifyPrompt(request: FirAskRequest, draft: { answer: string; citations: { quote: string; location?: string }[]; relatedEntities: string[]; confidence: string }) {
  return {
    system: `You are NETRA's final FIR-answer verifier. Check a draft answer only against the supplied document and structured analysis. Remove or correct every unsupported claim. Preserve useful citations only when their quote is actually present in the supplied text. If the document does not answer the question, say so plainly. Return one strict JSON object with answer, citations, relatedEntities, and confidence.`,
    user: `Question: ${request.question}\n\nDraft from Groq:\n${JSON.stringify(draft)}\n\nStructured analysis:\n${summarizeAnalysisForPrompt(request.analysis)}\n\n--- SOURCE DOCUMENT ---\n${request.documentText}\n--- END SOURCE ---`,
  }
}
