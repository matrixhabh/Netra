'use client'

import { useRef, useState } from 'react'
import { Check, ChevronRight, FileText, Info, LoaderCircle, MessageSquareText, Paperclip, Upload, X } from 'lucide-react'

type Stage = 'empty' | 'processing' | 'complete'

const entities = [
  ['PERSON', 'Rohan Mehta'], ['PERSON', 'Anita Sharma'], ['PHONE', '+91 98765 43210'], ['EMAIL', 'rohan.m@example.com'], ['ACCOUNT', 'AC-9482-1187'], ['UPI ID', 'rohanmehta@upi'], ['LOCATION', 'Pune, Maharashtra'], ['DATE', '14 Aug 2026'], ['VEHICLE', 'MH 12 AB 4821'],
]
const questions = ['Who are the primary entities mentioned?', 'What financial transactions are mentioned?', 'Which phone numbers appear in the FIR?', 'What relationships exist between the identified entities?']

export function FirAnalyzer() {
  const [stage, setStage] = useState<Stage>('empty')
  const [fileName, setFileName] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function selectFile(file?: File) {
    if (!file || file.type !== 'application/pdf') return
    setFileName(file.name)
    setStage('processing')
    window.setTimeout(() => setStage('complete'), 1800)
  }

  function ask(value = question) {
    if (!value.trim()) return
    setQuestion(value)
    setAnswer('The document references Rohan Mehta as the primary subject, with links to the listed phone number, UPI identifier, and account. These findings are extracted from the uploaded FIR and require investigator verification.')
  }

  return <div className="fir-workspace">
    <div className="fir-heading"><div><p className="portal-eyebrow">DOCUMENT INTELLIGENCE</p><h2>FIR Analyzer</h2><p>Extract entities, dates, relationships and investigation-relevant information from a case document.</p></div>{stage !== 'empty' && <button className="fir-reset" onClick={() => { setStage('empty'); setFileName(''); setAnswer(''); setQuestion('') }}><X size={14} /> New analysis</button>}</div>
    {stage === 'empty' && <section className="fir-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files[0]) }}><div className="fir-upload-icon"><Upload size={22} /></div><h3>Drop FIR / case document here</h3><p>or choose a PDF from your computer</p><button className="portal-primary fir-button" onClick={() => inputRef.current?.click()}><Paperclip size={15} /> Choose PDF</button><input ref={inputRef} type="file" accept="application/pdf" hidden onChange={e => selectFile(e.target.files?.[0])} /><small>Supported format: PDF</small></section>}
    {stage === 'processing' && <Processing fileName={fileName} />}
    {stage === 'complete' && <Results fileName={fileName} question={question} answer={answer} onAsk={ask} onQuestionChange={setQuestion} />}
  </div>
}

function Processing({ fileName }: { fileName: string }) { return <section className="fir-processing"><div className="fir-processing-icon"><LoaderCircle size={21} /></div><div><p className="portal-eyebrow">DOCUMENT PROCESSING</p><h3>Analyzing document</h3><p className="fir-file"><FileText size={14} /> {fileName}</p><p className="fir-muted">NETRA is extracting investigation-relevant information...</p></div><div className="fir-stages"><span><Check size={14} /> Document received</span><span><Check size={14} /> Text extracted</span><span className="active"><LoaderCircle size={14} /> Identifying entities</span><span><span className="fir-stage-dot" /> Mapping relationships</span><span><span className="fir-stage-dot" /> Generating investigation insights</span></div></section> }

function Results({ fileName, question, answer, onAsk, onQuestionChange }: { fileName: string; question: string; answer: string; onAsk: (value?: string) => void; onQuestionChange: (value: string) => void }) { return <div className="fir-results"><div className="fir-complete-line"><div><p className="portal-eyebrow">FIR ANALYSIS COMPLETE</p><h3>{fileName}</h3></div><span className="fir-status"><Check size={13} /> Analysis completed</span></div><div className="fir-result-grid"><main className="fir-main"><section className="fir-section"><SectionTitle label="DOCUMENT SUMMARY" /><p className="fir-summary">The FIR describes a suspected digital financial fraud involving unauthorized transfers through a UPI identifier and linked bank account. The document records the complainant&apos;s statement, transaction references and initial subject details for further investigation.</p><Source text="Source: FIR text · Page 1" /></section><section className="fir-section"><SectionTitle label="KEY FACTS" /><div className="fir-facts"><Fact label="Case / FIR number" value="FIR-2026-0814" /><Fact label="Date" value="14 August 2026" /><Fact label="Location" value="Pune Cyber Police Station" /><Fact label="Offence type" value="Digital financial fraud" /><Fact label="Investigating unit" value="Cyber Crime Cell" /><Fact label="Complainant" value="Anita Sharma" /><Fact label="Primary subject" value="Rohan Mehta" /></div></section><section className="fir-section"><SectionTitle label="EXTRACTED ENTITIES" /><div className="fir-entities">{entities.map(([type, value]) => <span className="fir-entity" key={`${type}-${value}`}><b>{type}</b>{value}</span>)}</div><Source text="Source: Extracted entities · Pages 1–3" /></section><section className="fir-section"><SectionTitle label="RELATIONSHIPS / CONNECTIONS" /><div className="fir-connections"><Connection a="Rohan Mehta" b="+91 98765 43210" /><Connection a="Rohan Mehta" b="AC-9482-1187" /><Connection a="AC-9482-1187" b="rohanmehta@upi" /><Connection a="Rohan Mehta" b="Pune, Maharashtra" /></div><Source text="Source: Relationship candidates · Page 2" /></section></main><aside className="fir-side"><section className="fir-section"><SectionTitle label="INVESTIGATION INTELLIGENCE" /><p className="fir-assist-label"><Info size={13} /> AI-assisted findings for investigator review</p><ul className="fir-leads"><li>Verify ownership of the linked UPI identifier.</li><li>Compare account activity against the transaction dates recorded in the FIR.</li><li>Confirm whether the phone number is associated with other complaints.</li></ul><Source text="Source: Pages 2–4" /></section><section className="fir-section"><SectionTitle label="EVIDENCE / SOURCE REFERENCES" /><div className="fir-sources"><Source text="Page 1 · Complainant statement" /><Source text="Page 2 · Transaction details" /><Source text="Page 4 · Subject identifiers" /></div></section></aside></div><section className="fir-qa"><SectionTitle label="ASK ABOUT THIS DOCUMENT" /><p>Ask questions grounded in the uploaded FIR.</p><div className="fir-suggestions">{questions.map(item => <button key={item} onClick={() => onAsk(item)}>{item}<ChevronRight size={13} /></button>)}</div><div className="fir-ask"><MessageSquareText size={16} /><input aria-label="Ask about this document" placeholder="Ask a question about this FIR..." value={question} onChange={e => onQuestionChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) onAsk() }} /><button onClick={() => onAsk()}>Ask</button></div>{answer && <div className="fir-answer"><span>NETRA analysis</span><p>{answer}</p></div>}</section></div> }
function SectionTitle({ label }: { label: string }) { return <div className="fir-section-title"><span>{label}</span><i /></div> }
function Fact({ label, value }: { label: string; value: string }) { return <div className="fir-fact"><span>{label}</span><strong>{value}</strong></div> }
function Connection({ a, b }: { a: string; b: string }) { return <div className="fir-connection"><span>{a}</span><ChevronRight size={14} /><span>{b}</span></div> }
function Source({ text }: { text: string }) { return <small className="fir-source">{text}</small> }
