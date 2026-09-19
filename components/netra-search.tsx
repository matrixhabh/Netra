'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BarChart3, BookOpen, CircleHelp, FileSearch, FileText, FolderKanban, LayoutDashboard, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type SearchDestination = {
  title: string
  description: string
  category: string
  href: string
  keywords: string[]
  icon: typeof Search
}

const landingDestinations: SearchDestination[] = [
  { title: 'Officer Portal', description: 'Investigation officer workspace', category: 'Workspace', href: '/officer', keywords: ['off', 'officer', 'workspace', 'portal'], icon: ShieldCheck },
  { title: 'FIR Analyzer', description: 'Analyze FIR and investigation documents', category: 'Document Intelligence', href: '/officer/fir-analyzer', keywords: ['fir', 'document', 'documents', 'analyzer'], icon: FileSearch },
  { title: 'Cases', description: 'Investigation case workspace', category: 'Workspace', href: '/officer/cases', keywords: ['case', 'cases', 'workspace'], icon: FolderKanban },
  { title: 'Evidence', description: 'Evidence management workspace', category: 'Workspace', href: '/officer/cases/C-1042?tab=evidence', keywords: ['evidence', 'proof', 'case'], icon: FileText },
  { title: 'Entities', description: 'Investigation entity register', category: 'Workspace', href: '/officer/cases/C-1042?tab=entities', keywords: ['entity', 'entities', 'person', 'account'], icon: Users },
  { title: 'Intelligence', description: 'Investigation intelligence workspace', category: 'Workspace', href: '/officer/intelligence', keywords: ['intel', 'intelligence', 'relation', 'relationships', 'network'], icon: BarChart3 },
]

const portalDestinations: SearchDestination[] = [
  { title: 'Overview', description: 'Investigation workspace overview', category: 'Workspace', href: '/officer', keywords: ['overview', 'dashboard'], icon: LayoutDashboard },
  ...landingDestinations.slice(2),
  { title: 'FIR Analyzer', description: 'Analyze FIR and investigation documents', category: 'Document Intelligence', href: '/officer/fir-analyzer', keywords: ['fir', 'document', 'documents', 'analyzer'], icon: FileSearch },
  { title: 'Help & Guidance', description: 'Get help using the officer portal', category: 'Support', href: '/officer/help', keywords: ['help', 'guidance', 'support'], icon: CircleHelp },
  { title: 'Documentation', description: 'Read NETRA investigation documentation', category: 'Support', href: '/officer/docs', keywords: ['doc', 'docs', 'documentation', 'guide'], icon: BookOpen },
  { title: 'Settings', description: 'Manage portal preferences', category: 'Account', href: '/officer/settings', keywords: ['setting', 'settings', 'preferences'], icon: Settings },
]

function rank(destination: SearchDestination, query: string) {
  const title = destination.title.toLowerCase()
  const description = destination.description.toLowerCase()
  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  if (description.includes(query)) return 3
  if (destination.keywords.some((keyword) => keyword.includes(query))) return 4
  return 99
}

export function NetraSearch({ scope = 'landing' }: { scope?: 'landing' | 'portal' }) {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const destinations = scope === 'portal' ? portalDestinations : landingDestinations
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return destinations
    return destinations.filter((destination) => rank(destination, normalized) < 99).sort((a, b) => rank(a, normalized) - rank(b, normalized)).slice(0, 7)
  }, [destinations, query])

  useEffect(() => {
    const openWithSlash = (event: KeyboardEvent) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); setOpen(true) }
    }
    document.addEventListener('keydown', openWithSlash)
    return () => document.removeEventListener('keydown', openWithSlash)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const closeOnOutsideClick = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  function navigate(index = selected) {
    const destination = results[index]
    if (!destination) return
    setOpen(false)
    setQuery('')
    router.push(destination.href)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { setOpen(false); return }
    if (!results.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelected((value) => (value + 1) % results.length) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelected((value) => (value - 1 + results.length) % results.length) }
    if (event.key === 'Enter') { event.preventDefault(); navigate() }
  }

  return <div className={`netra-search ${open ? 'is-open' : ''}`} ref={rootRef}>
    <button className="netra-search-trigger" aria-label="Search NETRA" aria-expanded={open} onClick={() => setOpen(true)}><Search size={18} /></button>
    {open && <div className="netra-search-popover" role="dialog" aria-label="Search NETRA">
      <div className="netra-search-input-wrap"><Search size={16} aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="Search NETRA..." aria-label="Search NETRA" autoComplete="off" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}<kbd>Esc</kbd></div>
      <div className="netra-search-results" role="listbox" aria-label="NETRA pages">
        {!query && <p className="netra-search-heading">Quick access</p>}
        {results.map((destination, index) => { const Icon = destination.icon; return <button key={destination.href} className={`netra-search-result ${selected === index ? 'selected' : ''}`} role="option" aria-selected={selected === index} onMouseEnter={() => setSelected(index)} onClick={() => navigate(index)}><span className="netra-search-icon"><Icon size={16} /></span><span className="netra-search-copy"><strong>{destination.title}</strong><small>{destination.description}</small></span><span className="netra-search-category">{destination.category}</span><ArrowRight size={14} /></button> })}
        {!results.length && <div className="netra-search-empty"><strong>No matching NETRA pages</strong><span>Try searching for cases, evidence, entities, FIRs, or intelligence.</span></div>}
      </div>
    </div>}
  </div>
}

export function NetraSearchShortcut() { return <span className="sr-only">Press / to search NETRA</span> }
