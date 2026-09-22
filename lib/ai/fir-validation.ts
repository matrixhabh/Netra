import type { ConfidenceLevel, FirAskResponse, FirCitation, FirEntity, FirEntityType, FirKeyFacts, FirRelationship, FirTimelineEvent } from './fir-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const ENTITY_TYPES: FirEntityType[] = ['person', 'organization', 'location', 'phone', 'email', 'vehicle', 'identifier', 'weapon', 'date', 'other']
const CONFIDENCE_LEVELS: ConfidenceLevel[] = ['High', 'Medium', 'Low']

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : []
}

function asConfidence(value: unknown): ConfidenceLevel {
  return CONFIDENCE_LEVELS.includes(value as ConfidenceLevel) ? (value as ConfidenceLevel) : 'Medium'
}

function asEntityType(value: unknown): FirEntityType {
  return ENTITY_TYPES.includes(value as FirEntityType) ? (value as FirEntityType) : 'other'
}

/** Strips ```json fences and any leading/trailing prose the model may add, then parses JSON. */
export function safeParseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

export type ExtractionPayload = {
  documentType: string
  summary: string
  keyFacts: FirKeyFacts
  entities: FirEntity[]
  relationships: FirRelationship[]
  timeline: FirTimelineEvent[]
}

export function validateExtractionPayload(value: unknown, idPrefix: string): ExtractionPayload {
  if (!isRecord(value)) return emptyExtractionPayload()

  const keyFactsRaw = isRecord(value.keyFacts) ? value.keyFacts : {}
  const keyFacts: FirKeyFacts = {
    firNumber: asString(keyFactsRaw.firNumber),
    policeStation: asString(keyFactsRaw.policeStation),
    district: asString(keyFactsRaw.district),
    actsAndSections: asStringArray(keyFactsRaw.actsAndSections),
    dateOfReport: asString(keyFactsRaw.dateOfReport),
    dateOfIncident: asString(keyFactsRaw.dateOfIncident),
    placeOfIncident: asString(keyFactsRaw.placeOfIncident),
    complainant: asString(keyFactsRaw.complainant),
    investigatingOfficer: asString(keyFactsRaw.investigatingOfficer),
  }

  const entities: FirEntity[] = (Array.isArray(value.entities) ? value.entities : [])
    .filter(isRecord)
    .filter((item) => asString(item.name))
    .map((item, index) => ({
      id: `${idPrefix}-ent-${index}`,
      type: asEntityType(item.type),
      name: asString(item.name) as string,
      role: asString(item.role),
      attributes: asStringArray(item.attributes),
      mentions: 1,
      confidence: asConfidence(item.confidence),
    }))

  const relationships: FirRelationship[] = (Array.isArray(value.relationships) ? value.relationships : [])
    .filter(isRecord)
    .filter((item) => asString(item.source) && asString(item.target))
    .map((item, index) => ({
      id: `${idPrefix}-rel-${index}`,
      source: asString(item.source) as string,
      target: asString(item.target) as string,
      relation: asString(item.relation) || 'related to',
      description: asString(item.description) || '',
      evidence: asString(item.evidence),
      confidence: asConfidence(item.confidence),
    }))

  const timeline: FirTimelineEvent[] = (Array.isArray(value.timeline) ? value.timeline : [])
    .filter(isRecord)
    .filter((item) => asString(item.description))
    .map((item, index) => ({
      id: `${idPrefix}-tl-${index}`,
      date: asString(item.date),
      time: asString(item.time),
      description: asString(item.description) as string,
      relatedEntities: asStringArray(item.relatedEntities),
    }))

  return {
    documentType: asString(value.documentType) || 'Unclassified document',
    summary: asString(value.summary) || '',
    keyFacts,
    entities,
    relationships,
    timeline,
  }
}

export function emptyExtractionPayload(): ExtractionPayload {
  return { documentType: 'Unclassified document', summary: '', keyFacts: {}, entities: [], relationships: [], timeline: [] }
}

export function validateAskPayload(value: unknown): FirAskResponse {
  if (!isRecord(value) || typeof value.answer !== 'string') {
    return { answer: 'The assistant could not produce a grounded answer for this question.', citations: [], relatedEntities: [], confidence: 'Low' }
  }
  const citations: FirCitation[] = (Array.isArray(value.citations) ? value.citations : [])
    .filter(isRecord)
    .filter((item) => asString(item.quote))
    .map((item) => ({ quote: asString(item.quote) as string, location: asString(item.location) }))

  return {
    answer: value.answer.trim(),
    citations,
    relatedEntities: asStringArray(value.relatedEntities),
    confidence: asConfidence(value.confidence),
  }
}
