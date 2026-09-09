'use client'

import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  FileSearch,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Network,
  Phone,
  Quote,
  RotateCcw,
  Send,
  Sparkles,
  UploadCloud,
  Users,
} from 'lucide-react'
import { analyzeFirPdf, askFirQuestion, type FirAnalyzeResult } from '@/lib/ai/fir-client'
import type { FirAskResponse, FirEntityType } from '@/lib/ai/fir-types'

type Status = 'idle' | 'processing' | 'error'
type Tab = 'summary' | 'entities' | 'relationships' | 'timeline'

const processingSteps = ['Reading the PDF', 'Extracting text by page', 'Identifying entities & dates', 'Mapping connections']

const entityIcon: Record<FirEntityType, typeof Users> = {
  person: Users,
  organization: Network,
  location: MapPin,
  phone: Phone,
  email: Mail,
  vehicle: FileText,
  identifier: FileSearch,
  weapon: AlertTriangle,
  date: Calendar,
  other: FileText,
}

type QaTurn = { question: string; response: FirAskResponse }

export function FirAnalyzer() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FirAnalyzeResult | null>(null)
  const [tab, setTab] = useState<Tab>('summary')
  const [dragOver, setDragOver] = useState(false)
  const [question, setQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState<QaTurn[]>([])
  const [qaStatus, setQaStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | null | undefined) {
    if (!file) return
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error')
      setError('Please upload a PDF file.')
      return
    }
    setStatus('processing')
    setError(null)
    setResult(null)
    setQaHistory([])
    try {
      const outcome = await analyzeFirPdf(file)
      setResult(outcome)
      setTab('summary')
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to analyze the document.')
    }
  }

  function reset() {
    setResult(null)
    setStatus('idle')
    setError(null)
    setQaHistory([])
    setQuestion('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function askQuestion(text?: string) {
    const q = (text ?? question).trim()
    if (!q || !result) return
    setQaStatus('loading')
    setQuestion('')
    try {
      const response = await askFirQuestion({
        question: q,
        documentText: result.documentText,
        analysis: result.analysis,
        history: qaHistory.slice(-4).map((turn) => ({ question: turn.question, answer: turn.response.answer })),
      })
      setQaHistory((prev) => [...prev, { question: q, response }])
      setQaStatus('idle')
    } catch (err) {
      setQaHistory((prev) => [...prev, { question: q, response: { answer: err instanceof Error ? err.message : 'Something went wrong.', citations: [], relatedEntities: [], confidence: 'Low' } }])
      setQaStatus('error')
    }
  }

  const suggestedQuestions = useMemo(() => {
    if (!result) return []
    const { analysis } = result
    const suggestions: string[] = []
    if (analysis.entities.some((e) => e.type === 'person')) suggestions.push('How are the people in this case connected?')
    if (analysis.keyFacts.dateOfIncident || analysis.timeline.length) suggestions.push('What is the timeline of events, in order?')
    if (analysis.keyFacts.actsAndSections?.length) suggestions.push('Which sections of law are cited, and why?')
    suggestions.push('Summarize this document in 3 sentences.')
    return suggestions.slice(0, 4)
  }, [result])

  return (
    <div className="fir-analyzer">
      {!result && (
        <section
          className={`fir-dropzone ${dragOver ? 'is-dragover' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragOver(false)
            handleFile(event.dataTransfer.files?.[0])
          }}
        >
          {status === 'processing' ? (
            <div className="fir-processing">
              <LoaderCircle className="spin" size={28} />
              <h3>Analyzing document…</h3>
              <ul className="fir-progress-steps">
                {processingSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <p className="fir-hint">Larger FIR bundles are processed page by page — this can take a little longer for multi-page reports.</p>
            </div>
          ) : (
            <>
              <div className="fir-dropzone-icon">
                <UploadCloud size={26} />
              </div>
              <h3>Upload an FIR or case document</h3>
              <p>Drag and drop a PDF here, or choose a file. NETRA will extract entities, dates, and connections automatically.</p>
              <button className="portal-primary" onClick={() => inputRef.current?.click()}>
                <UploadCloud size={16} /> Choose PDF
              </button>
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
              {status === 'error' && error && (
                <p className="assistant-error" role="alert">
                  <AlertTriangle size={13} /> {error}
                </p>
              )}
            </>
          )}
        </section>
      )}

      {result && (
        <>
          <div className="fir-result-header">
            <div>
              <p className="portal-eyebrow">{result.analysis.documentType.toUpperCase()}</p>
              <h2>{result.analysis.fileName}</h2>
              <div className="fir-meta-row">
                <span className={`fir-badge ${result.analysis.processedWith}`}>
                  {result.analysis.processedWith === 'llm' ? <Sparkles size={12} /> : <FileSearch size={12} />}
                  {result.analysis.processedWith === 'llm' ? 'Gemini + Groq semantic analysis' : 'Keyword analysis (configure Gemini + Groq keys)'}
                </span>
                <span>{result.analysis.pageCount} page{result.analysis.pageCount === 1 ? '' : 's'}</span>
                <span>{result.analysis.chunkCount} section{result.analysis.chunkCount === 1 ? '' : 's'} processed</span>
              </div>
            </div>
            <button className="portal-secondary" onClick={reset}>
              <RotateCcw size={15} /> Analyze another document
            </button>
          </div>

          {result.analysis.truncated && (
            <p className="fir-warning">
              <AlertTriangle size={13} /> This document is long — analysis covers the first {result.analysis.charCount.toLocaleString()} characters. Split very large bundles for full coverage.
            </p>
          )}

          <div className="case-workspace-grid fir-grid">
            <div className="case-workspace-main">
              <div className="portal-tabs fir-tabs">
                <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>
                  Summary
                </button>
                <button className={tab === 'entities' ? 'active' : ''} onClick={() => setTab('entities')}>
                  Entities <b>{result.analysis.entities.length}</b>
                </button>
                <button className={tab === 'relationships' ? 'active' : ''} onClick={() => setTab('relationships')}>
                  Connections <b>{result.analysis.relationships.length}</b>
                </button>
                <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>
                  Timeline <b>{result.analysis.timeline.length}</b>
                </button>
              </div>

              {tab === 'summary' && (
                <section className="portal-card">
                  <div className="portal-section-header">
                    <div>
                      <p>OVERVIEW</p>
                      <h2>What this document says</h2>
                    </div>
                  </div>
                  <p className="case-summary">{result.analysis.summary}</p>
                  <div className="case-facts fir-key-facts">
                    <div>
                      <span>FIR number</span>
                      <strong>{result.analysis.keyFacts.firNumber || '—'}</strong>
                    </div>
                    <div>
                      <span>Police station</span>
                      <strong>{result.analysis.keyFacts.policeStation || '—'}</strong>
                    </div>
                    <div>
                      <span>District</span>
                      <strong>{result.analysis.keyFacts.district || '—'}</strong>
                    </div>
                    <div>
                      <span>Date of report</span>
                      <strong>{result.analysis.keyFacts.dateOfReport || '—'}</strong>
                    </div>
                    <div>
                      <span>Date of incident</span>
                      <strong>{result.analysis.keyFacts.dateOfIncident || '—'}</strong>
                    </div>
                    <div>
                      <span>Place of incident</span>
                      <strong>{result.analysis.keyFacts.placeOfIncident || '—'}</strong>
                    </div>
                    <div>
                      <span>Complainant</span>
                      <strong>{result.analysis.keyFacts.complainant || '—'}</strong>
                    </div>
                    <div>
                      <span>Investigating officer</span>
                      <strong>{result.analysis.keyFacts.investigatingOfficer || '—'}</strong>
                    </div>
                  </div>
                  {!!result.analysis.keyFacts.actsAndSections?.length && (
                    <div className="fir-tag-row">
                      {result.analysis.keyFacts.actsAndSections.map((section) => (
                        <span className="fir-tag" key={section}>
                          {section}
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === 'entities' && (
                <section className="portal-card">
                  <div className="portal-section-header">
                    <div>
                      <p>ENTITY REGISTER</p>
                      <h2>People, places & identifiers</h2>
                    </div>
                  </div>
                  {result.analysis.entities.length === 0 ? (
                    <div className="empty-state">No entities were confidently identified in this document.</div>
                  ) : (
                    <div className="entity-grid">
                      {result.analysis.entities.map((entity) => {
                        const Icon = entityIcon[entity.type]
                        return (
                          <div className="entity-card fir-entity-card" key={entity.id}>
                            <span className={`fir-entity-icon fir-type-${entity.type}`}>
                              <Icon size={13} />
                            </span>
                            <span>{entity.role || entity.type}</span>
                            <strong>{entity.name}</strong>
                            {!!entity.attributes.length && <p>{entity.attributes.join(' · ')}</p>}
                            <small>{entity.confidence} confidence · {entity.mentions} mention{entity.mentions === 1 ? '' : 's'}</small>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {tab === 'relationships' && (
                <section className="portal-card">
                  <div className="portal-section-header">
                    <div>
                      <p>RELATIONSHIP GRAPH</p>
                      <h2>How entities connect</h2>
                    </div>
                  </div>
                  {result.analysis.relationships.length === 0 ? (
                    <div className="empty-state">No explicit connections between entities were found. Ask the assistant about specific names to probe further.</div>
                  ) : (
                    <div className="relationship-list">
                      {result.analysis.relationships.map((rel) => (
                        <div className="relationship-row" key={rel.id}>
                          <div className="relationship-parties">
                            <strong>{rel.source}</strong>
                            <span className="relationship-label">{rel.relation}</span>
                            <strong>{rel.target}</strong>
                          </div>
                          <p>{rel.description}</p>
                          <div className="relationship-meta">
                            {rel.evidence && (
                              <span>
                                <Quote size={11} /> “{rel.evidence}”
                              </span>
                            )}
                            {rel.location && <span>{rel.location}</span>}
                            <span>{rel.confidence} confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === 'timeline' && (
                <section className="portal-card">
                  <div className="portal-section-header">
                    <div>
                      <p>CASE HISTORY</p>
                      <h2>Sequence of events</h2>
                    </div>
                  </div>
                  {result.analysis.timeline.length === 0 ? (
                    <div className="empty-state">No dated events could be extracted from this document.</div>
                  ) : (
                    <div className="timeline-list">
                      {result.analysis.timeline.map((event) => (
                        <div className="timeline-item" key={event.id}>
                          <span className="timeline-marker analysis" />
                          <div>
                            <small>
                              {[event.date, event.time].filter(Boolean).join(' · ') || 'Undated'}
                              {event.location ? ` · ${event.location}` : ''}
                            </small>
                            <p>{event.description}</p>
                            {!!event.relatedEntities.length && <small className="fir-timeline-entities">Involves: {event.relatedEntities.join(', ')}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            <aside className="case-context">
              <div className="assistant-panel fir-qa-panel">
                <div className="assistant-heading">
                  <span>
                    <Sparkles size={16} /> ASK ABOUT THIS DOCUMENT
                  </span>
                </div>
                <div className="fir-qa-thread">
                  {qaHistory.length === 0 && <p className="fir-qa-empty">Ask about dates, sections of law, or how two people or entities are connected — answers are grounded in this document only.</p>}
                  {qaHistory.map((turn, index) => (
                    <div className="fir-qa-turn" key={index}>
                      <p className="fir-qa-question">{turn.question}</p>
                      <div className="fir-qa-answer">
                        <p>{turn.response.answer}</p>
                        {!!turn.response.relatedEntities.length && (
                          <div className="fir-tag-row small">
                            {turn.response.relatedEntities.map((name) => (
                              <span className="fir-tag" key={name}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                        {turn.response.citations.map((citation, citationIndex) => (
                          <p className="fir-qa-citation" key={citationIndex}>
                            <Quote size={11} /> “{citation.quote}”{citation.location ? ` — ${citation.location}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {qaStatus === 'loading' && (
                    <div className="fir-qa-turn">
                      <div className="fir-qa-answer fir-qa-loading">
                        <LoaderCircle className="spin" size={14} /> Reading the document…
                      </div>
                    </div>
                  )}
                </div>
                {!qaHistory.length && !!suggestedQuestions.length && (
                  <div className="fir-suggested-questions">
                    {suggestedQuestions.map((suggestion) => (
                      <button key={suggestion} className="lead" onClick={() => askQuestion(suggestion)}>
                        {suggestion} <Send size={13} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="assistant-input">
                  <input
                    aria-label="Ask about this document"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="e.g. How is Anil connected to the complainant?"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) askQuestion()
                    }}
                  />
                  <button onClick={() => askQuestion()} disabled={qaStatus === 'loading' || !question.trim()} aria-label="Ask">
                    {qaStatus === 'loading' ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
                  </button>
                </div>
              </div>

              <div className="portal-card review-card">
                <p className="portal-eyebrow">HUMAN REVIEW</p>
                <h3>Verify before acting.</h3>
                <p>Extracted facts and connections are assistive. Cross-check names, dates, and legal sections against the original document before use in a case file.</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
