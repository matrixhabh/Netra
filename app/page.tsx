'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, BarChart3, BookOpen, Check, ChevronRight, FileText, FolderLock, Link, Menu, Monitor, Moon, Network, Search, ShieldCheck, Sparkles, Sun, UserRound, X } from 'lucide-react'
import { defaultLocale } from '@/lib/i18n/config'
import { getTranslation } from '@/lib/i18n/translations'
import type { Locale, TranslationKey } from '@/lib/i18n/types'
import { InvestigationAssistant } from '@/components/investigation-assistant'

type Theme = 'light' | 'dark' | 'system'

const capabilities = [
  ['Unified Case Workspace', 'Manage complaints, evidence and investigation workflows in one place.', FileText],
  ['Evidence Vault', 'Maintain structured evidence records, metadata and audit history.', FolderLock],
  ['Investigation Assistant', 'Prepare summaries, extract indicators and draft structured reports.', Sparkles],
  ['Relationship Intelligence', 'Connect identifiers, entities and related cases for clearer context.', Network],
  ['Smart Case Prioritization', 'Categorize and prioritize incoming cases for focused review.', BarChart3],
  ['Audit Trail', 'Keep a clear history of actions, decisions and access across every case.', BookOpen],
] as const

const workflow = [
  ['01', 'Report', 'Citizens submit complaints with relevant details.'],
  ['02', 'Triage', 'Cases are categorized and prioritized for review.'],
  ['03', 'Investigate', 'Teams organize evidence, analyze relationships and collaborate.'],
  ['04', 'Resolve', 'Track actions, generate reports and close cases.'],
]

function Logo({ tagline }: { tagline: string }) {
  return <a href="#top" className="flex items-center gap-3" aria-label="NETRA home"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck size={19} /></span><span><span className="block text-[17px] font-semibold tracking-tight">NETRA</span><span className="block text-[10px] tracking-[0.12em] text-muted-foreground">{tagline}</span></span></a>
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    const saved = window.localStorage.getItem('netra-theme') as Theme | null
    const next = saved || 'system'
    setTheme(next)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (value: Theme) => document.documentElement.classList.toggle('dark', value === 'dark' || (value === 'system' && media.matches))
    apply(next)
    const onChange = () => { if (next === 'system') apply('system') }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  function change(next: Theme) {
    setTheme(next)
    window.localStorage.setItem('netra-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }
  const icons = { light: Sun, dark: Moon, system: Monitor }
  return <div className="theme-toggle" aria-label="Theme selection">{(['light', 'dark', 'system'] as Theme[]).map((item) => { const Icon = icons[item]; return <button key={item} onClick={() => change(item)} aria-label={`${item} theme`} aria-pressed={theme === item} className={theme === item ? 'active' : ''}><Icon size={13} aria-hidden="true" /></button> })}</div>
}

function LanguageSelector({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return <label className="language-select"><span className="sr-only">Language</span><select value={locale} onChange={(event) => onChange(event.target.value as Locale)} aria-label="Language"><option value="en">EN</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></label>
}

function SectionLabel({ children }: { children: React.ReactNode }) { return <p className="section-label"><span />{children}</p> }

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const node = document.querySelector(`[data-reveal-id="${className}"]`)
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [className])
  return <div data-reveal-id={className} className={`reveal ${visible ? 'is-visible' : ''} ${className}`}>{children}</div>
}

function ProductPreview({ assistantTitle }: { assistantTitle: string }) {
  return <div className="product-preview"><div className="preview-top"><span>CASE C-1042</span><span className="status"><i /> Active</span><span className="assistant"><Sparkles size={14} /> {assistantTitle} <small>Local AI</small></span></div><h3>UPI Fraud Investigation</h3><div className="preview-tabs"><span className="selected">Overview</span><span>Evidence</span><span>Analysis</span><span>Timeline</span></div><div className="preview-body"><div className="case-details"><p><span>Priority</span><b>High</b></p><p><span>Amount</span><b>₹85,000</b></p><p><span>Assigned</span><b>Cyber Crime Unit</b></p><p><span>Reported on</span><b>02 Sep 2026</b></p><p><span>Status</span><em>In Investigation</em></p></div><div className="relationship"><div className="relation-center"><UserRound size={20} /> Complainant</div><span className="line line-top" /><span className="line line-left" /><span className="line line-right" /><span className="line line-bottom" /><div className="relation-node node-top">Bank Account</div><div className="relation-node node-left">Phone Number</div><div className="relation-node node-right">IP Address</div><div className="relation-node node-bottom">UPI ID</div><div className="relation-node node-domain">Suspicious Domain</div></div></div><div className="links-badge"><Check size={14} /> 3 potential links identified <ChevronRight size={14} /></div></div>
}

function App() {
  const [menu, setMenu] = useState(false)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const t = (key: TranslationKey) => getTranslation(locale, key)
  const navItems: [TranslationKey, string][] = [['nav.platform', 'platform'], ['nav.solutions', 'solutions'], ['nav.workflow', 'how-it-works'], ['nav.security', 'security'], ['nav.about', 'about'], ['nav.resources', 'resources']]
  function changeLocale(next: Locale) { setLocale(next); document.documentElement.lang = next }
  return <main id="top"><header className="site-header"><div className="container nav-wrap"><Logo tagline={t('brand.tagline')} /><nav className={menu ? 'mobile-open' : ''}>{navItems.map(([key, id]) => <a key={key} href={`#${id}`} onClick={() => setMenu(false)}>{t(key)}</a>)}  <a href="/officer" className="mobile-portal-link" onClick={() => setMenu(false)}> <span>Officer Portal</span> <ArrowUpRight size={15} /></a>
    </nav><div className="nav-actions"><Search size={18} aria-label="Search" /><LanguageSelector locale={locale} onChange={changeLocale} /><ThemeToggle /><a href="/officer" className="portal">Officer Portal <ArrowUpRight size={15} /></a><button className="menu-button" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'}>{menu ? <X /> : <Menu />}</button></div></div></header>
    <section className="hero opening"><div className="container hero-grid"><div className="hero-copy opening-copy"><SectionLabel>{t('hero.eyebrow')}</SectionLabel><h1>{t('hero.title')}</h1><p>{t('hero.description')}</p><div className="hero-actions"><a href="#platform" className="button button-primary">{t('hero.primary')} <ArrowUpRight size={16} /></a><a href="#how-it-works" className="button button-secondary">{t('hero.secondary')}</a></div><div className="trust-line"><span>Built for real-world investigations</span><span>Privacy by design</span><span>Human-led intelligence</span></div></div><div className="opening-preview"><ProductPreview assistantTitle={t('assistant.title')} /></div></div></section>
    <section className="value-strip" id="platform"><Reveal className="reveal-value"><div className="container value-grid">{[['Structured Case Management', 'Manage complaints, evidence and investigation workflows in one place.', FileText], ['Evidence Organization', 'Maintain structured evidence records, metadata and audit history.', ShieldCheck], ['Investigation Intelligence', 'Surface patterns, relationships and investigative leads with AI assistance.', BarChart3]].map(([title, body, Icon]) => <div className="value-item" key={title as string}><span className="icon-box"><Icon size={21} /></span><div><h3>{title as string}</h3><p>{body as string}</p></div></div>)}</div></Reveal></section>
    <section className="section workflow" id="how-it-works"><Reveal className="reveal-workflow"><div className="container workflow-grid"><div className="intro"><SectionLabel>{t('workflow.eyebrow')}</SectionLabel><h2>{t('workflow.title')}</h2><p>A streamlined workflow designed for cybercrime investigation teams.</p><a href="#solutions" className="text-link">See the full process <ArrowUpRight size={15} /></a></div><div className="steps">{workflow.map(([number, title, body]) => <div className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{body}</p></div>)}</div></div></Reveal></section>
    <section className="section capabilities" id="solutions"><div className="container"><div className="section-heading"><div><SectionLabel>Capabilities</SectionLabel><h2>One clear system for serious investigations.</h2></div><p>Purpose-built tools that keep every case moving with context and accountability.</p></div><div className="capability-grid">{capabilities.map(([title, body, Icon]) => <article key={title}><Icon size={20} className="cap-icon" /><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section className="section intelligence"><div className="container intelligence-grid"><div><SectionLabel>Investigation intelligence</SectionLabel><h2>Intelligence that assists the investigation.</h2><p>NETRA is designed to help investigators summarize case information, surface relevant indicators, identify relationships and prepare structured investigative reports — while keeping final decisions with the investigator.</p><span className="human-label"><UserRound size={14} /> Human-in-the-loop</span></div><InvestigationAssistant language={locale} /></div></section>
    <section className="section security" id="security"><div className="container security-grid"><div><SectionLabel>Accountable by design</SectionLabel><h2>Built around accountable workflows.</h2><p>Security is not a claim. It is a set of visible, controlled practices that support the people responsible for every decision.</p></div><div className="security-list">{['Role-based access', 'Audit history', 'Evidence integrity support', 'Controlled information access'].map((x) => <div key={x}><ShieldCheck size={19} />{x}<ArrowUpRight size={15} /></div>)}</div></div></section>
    <section className="cta" id="contact"><div className="container"><SectionLabel>Next phase</SectionLabel><h2>Serious tools for a safer tomorrow.</h2><p>See how NETRA can support the way your investigation teams work.</p><a href="mailto:hello@netra.example" className="button button-primary">Talk to our team <ArrowUpRight size={16} /></a></div></section>
    <footer id="about"><div className="container footer-grid"><div><Logo tagline={t('brand.tagline')} /><p>{t('footer.tagline')}</p></div><div><span className="footer-title">Explore</span><a href="#platform">Platform</a><a href="#solutions">Solutions</a><a href="#security">Security</a></div><div><span className="footer-title">Company</span><a href="#about">About</a><a href="#contact">Resources</a><a href="mailto:hello@netra.example">Contact</a></div></div><div className="container footer-bottom"><span>© 2026 NETRA</span><span>Privacy &nbsp; Terms</span></div></footer>
  </main>
}

export default App
