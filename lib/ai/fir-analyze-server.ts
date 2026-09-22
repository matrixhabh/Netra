import { callGemini, callGroq, areFirLlmsConfigured } from './llm-server'
import type { FirChunk, FirDocumentAnalysis, FirEntity, FirRelationship, FirTimelineEvent } from './fir-types'
import { buildFirExtractionPrompt, buildFirSynthesisPrompt } from './fir-prompts'
import { safeParseJson, validateExtractionPayload, type ExtractionPayload } from './fir-validation'
import { heuristicExtract } from './fir-heuristic'

function pageRangeLabel(chunk: FirChunk) {
  return chunk.startPage === chunk.endPage ? `page ${chunk.startPage}` : `pages ${chunk.startPage}-${chunk.endPage}`
}

async function extractChunkWithGemini(chunk: FirChunk, chunkCount: number): Promise<ExtractionPayload> {
  const { system, user } = buildFirExtractionPrompt(chunk.text, { chunkIndex: chunk.index, chunkCount, pageRange: pageRangeLabel(chunk) })
  const raw = await callGemini({ system, user, maxOutputTokens: 3000 })
  const payload = validateExtractionPayload(safeParseJson(raw), `c${chunk.index}`)
  return {
    ...payload,
    relationships: payload.relationships.map((r) => ({ ...r, location: pageRangeLabel(chunk) })),
    timeline: payload.timeline.map((t) => ({ ...t, location: pageRangeLabel(chunk) })),
  }
}

function mergeEntities(all: FirEntity[]): FirEntity[] {
  const byKey = new Map<string, FirEntity>()
  for (const entity of all) {
    const key = `${entity.type}:${entity.name.toLowerCase().trim()}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { ...entity, mentions: 1 })
      continue
    }
    existing.mentions += 1
    existing.attributes = [...new Set([...existing.attributes, ...entity.attributes])].slice(0, 8)
    if (!existing.role && entity.role) existing.role = entity.role
    if (entity.confidence === 'High') existing.confidence = 'High'
  }
  return [...byKey.values()].sort((a, b) => b.mentions - a.mentions).map((entity, index) => ({ ...entity, id: `ent-${index}` }))
}

function mergeRelationships(all: FirRelationship[]): FirRelationship[] {
  const byKey = new Map<string, FirRelationship>()
  for (const rel of all) {
    const key = `${rel.source.toLowerCase()}|${rel.target.toLowerCase()}|${rel.relation.toLowerCase()}`
    if (!byKey.has(key)) byKey.set(key, rel)
  }
  return [...byKey.values()].map((rel, index) => ({ ...rel, id: `rel-${index}` }))
}

function mergeTimeline(all: FirTimelineEvent[]): FirTimelineEvent[] {
  const deduped = new Map<string, FirTimelineEvent>()
  for (const event of all) {
    const key = `${event.date || ''}|${event.description.toLowerCase().slice(0, 60)}`
    if (!deduped.has(key)) deduped.set(key, event)
  }
  return [...deduped.values()].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((event, index) => ({ ...event, id: `tl-${index}` }))
}

function mergeKeyFacts(payloads: ExtractionPayload[]): FirDocumentAnalysis['keyFacts'] {
  const merged: FirDocumentAnalysis['keyFacts'] = {}
  const sectionSet = new Set<string>()
  for (const payload of payloads) {
    const facts = payload.keyFacts
    merged.firNumber ||= facts.firNumber
    merged.policeStation ||= facts.policeStation
    merged.district ||= facts.district
    merged.dateOfReport ||= facts.dateOfReport
    merged.dateOfIncident ||= facts.dateOfIncident
    merged.placeOfIncident ||= facts.placeOfIncident
    merged.complainant ||= facts.complainant
    merged.investigatingOfficer ||= facts.investigatingOfficer
    for (const section of facts.actsAndSections || []) sectionSet.add(section)
  }
  merged.actsAndSections = [...sectionSet]
  return merged
}

async function synthesizeSummary(fileName: string, payloads: ExtractionPayload[], keyFacts: FirDocumentAnalysis['keyFacts']): Promise<{ documentType: string; summary: string }> {
  if (payloads.length === 1) return { documentType: payloads[0].documentType, summary: payloads[0].summary || 'No summary could be generated for this document.' }
  const summaries = payloads.map((p) => p.summary).filter(Boolean)
  if (!summaries.length) return { documentType: payloads[0]?.documentType || 'Unclassified document', summary: 'No summary could be generated for this document.' }

  try {
    const { system, user } = buildFirSynthesisPrompt(fileName, summaries, JSON.stringify(keyFacts))
    const raw = await callGroq({ system, user, maxTokens: 800 })
    const parsed = safeParseJson(raw) as { documentType?: string; summary?: string } | null
    if (parsed?.summary) return { documentType: parsed.documentType || payloads[0].documentType, summary: parsed.summary }
  } catch {
    // Local merge remains available if Groq is temporarily unavailable.
  }
  return { documentType: payloads[0]?.documentType || 'Unclassified document', summary: summaries.join(' ') }
}

export async function analyzeFirChunks(fileName: string, chunks: FirChunk[], pageCount: number, truncated: boolean, totalChars: number): Promise<FirDocumentAnalysis> {
  const useLlms = areFirLlmsConfigured()
  const payloads = useLlms
    ? await Promise.all(chunks.map((chunk) => extractChunkWithGemini(chunk, chunks.length).catch(() => heuristicExtract(chunk.text))))
    : chunks.map((chunk) => heuristicExtract(chunk.text))

  const keyFacts = mergeKeyFacts(payloads)
  const entities = mergeEntities(payloads.flatMap((p) => p.entities))
  const relationships = mergeRelationships(payloads.flatMap((p) => p.relationships))
  const timeline = mergeTimeline(payloads.flatMap((p) => p.timeline))
  const { documentType, summary } = useLlms
    ? await synthesizeSummary(fileName, payloads, keyFacts)
    : { documentType: payloads[0]?.documentType || 'Unclassified document', summary: payloads.map((p) => p.summary).filter(Boolean).slice(0, 2).join(' ') || 'No summary could be generated for this document.' }

  return {
    fileName,
    documentType,
    summary,
    keyFacts,
    entities,
    relationships,
    timeline,
    pageCount,
    charCount: totalChars,
    truncated,
    processedWith: useLlms ? 'llm' : 'heuristic',
    chunkCount: chunks.length,
  }
}
