import type { ExtractionPayload } from './fir-validation'
import { emptyExtractionPayload } from './fir-validation'
import type { FirAskResponse, FirDocumentAnalysis, FirEntity, FirRelationship, FirTimelineEvent } from './fir-types'

const DATE_PATTERN = /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b|\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi
const TIME_PATTERN = /\b(\d{1,2}[:.]\d{2}\s?(?:hrs|hours|am|pm)?)\b/gi
const PHONE_PATTERN = /(?:\+?91[-\s]?)?[6-9]\d{9}\b/g
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const VEHICLE_PATTERN = /\b[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}\b/g
const FIR_NUMBER_PATTERN = /FIR\s*No\.?\s*[:\-]?\s*([A-Za-z0-9\/\-]+)/i
const POLICE_STATION_PATTERN = /(?:Police\s*Station|P\.?S\.?)\s*[:\-]?\s*([A-Za-z0-9 ,.'()-]{2,60})/i
const DISTRICT_PATTERN = /District\s*[:\-]?\s*([A-Za-z ,.'()-]{2,50})/i
const SECTIONS_PATTERN = /(?:u\/s|under\s+section|section[s]?)\s*[:\-]?\s*([0-9][0-9A-Za-z, \/&-]{0,60}?(?:IPC|BNS|CrPC|BNSS|Act)?)\b/gi
const NAME_CONTEXT_PATTERN = /(Complainant|Accused|Victim|Witness|Informant|Investigating Officer)\s*[:\-]?\s*([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,3})/g
const RELATION_CONTEXT_PATTERN = /([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,3})[,\s]+(son|daughter|wife|husband)\s+of\s+([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,3})/g

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Map<string, T>()
  for (const item of items) {
    const k = key(item).toLowerCase().trim()
    if (!seen.has(k)) seen.set(k, item)
  }
  return [...seen.values()]
}

/**
 * Deterministic, keyword/regex based extraction used when no LLM API key is
 * configured. It cannot reason about meaning the way an LLM can, but it
 * gives investigators a useful first pass — key identifiers, dates, and
 * roles — entirely offline.
 */
export function heuristicExtract(text: string): ExtractionPayload {
  const payload = emptyExtractionPayload()
  payload.documentType = /first information report|f\.?i\.?r\.?/i.test(text) ? 'First Information Report (heuristic pass)' : 'Case document (heuristic pass)'

  const firMatch = text.match(FIR_NUMBER_PATTERN)
  const psMatch = text.match(POLICE_STATION_PATTERN)
  const districtMatch = text.match(DISTRICT_PATTERN)
  const sections = uniqueBy(
    [...text.matchAll(SECTIONS_PATTERN)].map((m) => m[1]?.trim()).filter((s): s is string => Boolean(s)),
    (s) => s,
  ).slice(0, 12)
  const dates = uniqueBy(
    [...text.matchAll(DATE_PATTERN)].map((m) => (m[1] || m[2] || '').trim()).filter(Boolean),
    (d) => d,
  )

  payload.keyFacts = {
    firNumber: firMatch?.[1],
    policeStation: psMatch?.[1]?.replace(/\s+/g, ' ').trim(),
    district: districtMatch?.[1]?.replace(/\s+/g, ' ').trim(),
    actsAndSections: sections,
    dateOfReport: dates[0],
    dateOfIncident: dates[1] || dates[0],
  }

  const entities: FirEntity[] = []
  const roleMatches = [...text.matchAll(NAME_CONTEXT_PATTERN)]
  for (const match of roleMatches) {
    const role = match[1]
    const name = match[2]?.trim()
    if (!name) continue
    entities.push({ id: '', type: 'person', name, role, attributes: [], mentions: 1, confidence: 'Medium' })
  }

  for (const phone of uniqueBy([...text.matchAll(PHONE_PATTERN)].map((m) => m[0]), (s) => s)) {
    entities.push({ id: '', type: 'phone', name: phone, attributes: [], mentions: 1, confidence: 'Medium' })
  }
  for (const email of uniqueBy([...text.matchAll(EMAIL_PATTERN)].map((m) => m[0]), (s) => s)) {
    entities.push({ id: '', type: 'email', name: email, attributes: [], mentions: 1, confidence: 'Medium' })
  }
  for (const vehicle of uniqueBy([...text.matchAll(VEHICLE_PATTERN)].map((m) => m[0]), (s) => s)) {
    entities.push({ id: '', type: 'vehicle', name: vehicle, attributes: [], mentions: 1, confidence: 'Low' })
  }
  if (payload.keyFacts.policeStation) {
    entities.push({ id: '', type: 'location', name: payload.keyFacts.policeStation, role: 'Police station', attributes: [], mentions: 1, confidence: 'Medium' })
  }

  payload.entities = uniqueBy(entities, (e) => `${e.type}:${e.name}`).map((entity, index) => ({ ...entity, id: `heuristic-ent-${index}` }))

  const relationships: FirRelationship[] = []
  for (const match of [...text.matchAll(RELATION_CONTEXT_PATTERN)]) {
    const [, name, relationWord, parent] = match
    if (!name || !parent) continue
    const relation = relationWord === 'son' || relationWord === 'daughter' ? `${relationWord} of` : `${relationWord} of`
    relationships.push({ id: '', source: name.trim(), target: parent.trim(), relation, description: `${name.trim()} is the ${relation} ${parent.trim()}, per the document text.`, confidence: 'Medium' })
  }
  payload.relationships = relationships.map((rel, index) => ({ ...rel, id: `heuristic-rel-${index}` }))

  const timeline: FirTimelineEvent[] = dates.slice(0, 8).map((date, index) => {
    const dateIndex = text.indexOf(date)
    const windowText = dateIndex >= 0 ? text.slice(Math.max(0, dateIndex - 20), dateIndex + 140).replace(/\s+/g, ' ').trim() : date
    const timeNearby = windowText.match(TIME_PATTERN)?.[0]
    return { id: `heuristic-tl-${index}`, date, time: timeNearby, description: windowText, relatedEntities: [] }
  })
  payload.timeline = timeline

  const firstSentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).slice(0, 3).join(' ')
  payload.summary = firstSentences || 'No readable text was found to summarize.'

  return payload
}

/**
 * Naive local search used for Q&A when no LLM is configured: scores
 * sentences by keyword overlap with the question and returns the strongest
 * matches as the answer, with the matching sentences as citations.
 */
export function heuristicAsk(question: string, documentText: string): FirAskResponse {
  const stopwords = new Set(['the', 'is', 'are', 'was', 'were', 'a', 'an', 'of', 'to', 'in', 'on', 'and', 'or', 'what', 'who', 'when', 'where', 'how', 'did', 'does', 'this', 'that', 'for', 'with'])
  const questionWords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))

  const sentences = documentText
    .replace(/\[Page \d+\]/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length > 8)

  const scored = sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase()
      const score = questionWords.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0)
      return { sentence, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (scored.length === 0) {
    return {
      answer: "The document doesn't appear to contain a direct answer to that question. Try rephrasing, or connect an LLM API key for deeper semantic search.",
      citations: [],
      relatedEntities: [],
      confidence: 'Low',
    }
  }

  return {
    answer: scored.map((item) => item.sentence).join(' '),
    citations: scored.map((item) => ({ quote: item.sentence.slice(0, 220) })),
    relatedEntities: [],
    confidence: scored[0].score >= 3 ? 'Medium' : 'Low',
  }
}
