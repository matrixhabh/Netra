export type FirEntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'phone'
  | 'email'
  | 'vehicle'
  | 'identifier'
  | 'weapon'
  | 'date'
  | 'other'

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export type FirEntity = {
  id: string
  type: FirEntityType
  name: string
  role?: string
  attributes: string[]
  mentions: number
  confidence: ConfidenceLevel
}

export type FirRelationship = {
  id: string
  source: string
  target: string
  relation: string
  description: string
  evidence?: string
  location?: string
  confidence: ConfidenceLevel
}

export type FirTimelineEvent = {
  id: string
  date?: string
  time?: string
  description: string
  relatedEntities: string[]
  location?: string
}

export type FirKeyFacts = {
  firNumber?: string
  policeStation?: string
  district?: string
  actsAndSections?: string[]
  dateOfReport?: string
  dateOfIncident?: string
  placeOfIncident?: string
  complainant?: string
  investigatingOfficer?: string
}

export type FirDocumentAnalysis = {
  fileName: string
  documentType: string
  summary: string
  keyFacts: FirKeyFacts
  entities: FirEntity[]
  relationships: FirRelationship[]
  timeline: FirTimelineEvent[]
  pageCount: number
  charCount: number
  truncated: boolean
  processedWith: 'llm' | 'heuristic'
  chunkCount: number
}

export type FirCitation = {
  quote: string
  location?: string
}

export type FirAskResponse = {
  answer: string
  citations: FirCitation[]
  relatedEntities: string[]
  confidence: ConfidenceLevel
}

export type FirAskRequest = {
  question: string
  documentText: string
  analysis: FirDocumentAnalysis
  language?: 'en' | 'hi' | 'mr'
  history?: { question: string; answer: string }[]
}

export type FirPageText = {
  num: number
  text: string
}

export type FirChunk = {
  index: number
  startPage: number
  endPage: number
  text: string
}
