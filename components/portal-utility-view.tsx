'use client'

import { BookOpen, CircleHelp, FileText, Network, Settings, Users } from 'lucide-react'
import { OfficerOverview } from './officer-portal'

const copy: Record<string, { eyebrow:string; title:string; description:string; icon:typeof BookOpen; items:string[] }> = {
  evidence: { eyebrow:'EVIDENCE REGISTER', title:'Evidence workspace', description:'Review evidence captured across active investigations.', icon:FileText, items:['Evidence sync queue','Files awaiting verification','Recently reviewed exhibits'] },
  entities: { eyebrow:'ENTITY REGISTER', title:'Entities', description:'Resolve people, accounts, domains, and identifiers across cases.', icon:Users, items:['People and organizations','Accounts and identifiers','High-confidence matches'] },
  intelligence: { eyebrow:'INTELLIGENCE DESK', title:'Intelligence', description:'Review assistant findings and analyst-approved signals.', icon:Network, items:['Open investigation briefs','Related case patterns','Analyst review queue'] },
  docs: { eyebrow:'REFERENCE', title:'Documentation', description:'Operational guidance for secure investigation workflows.', icon:BookOpen, items:['Case management workflow','Evidence handling standards','Audit and review policy'] },
  help: { eyebrow:'SUPPORT', title:'Help & guidance', description:'Find answers or contact the NETRA operations desk.', icon:CircleHelp, items:['Getting started','Access and permissions','Request operational support'] },
  settings: { eyebrow:'SYSTEM', title:'Settings', description:'Manage your officer workspace preferences.', icon:Settings, items:['Theme and display','Notification preferences','Workspace permissions'] },
}
export function UtilityView({ section }: { section:string }) { const data = copy[section] || copy.help; const Icon = data.icon; return <><div className="portal-welcome"><div><p className="portal-eyebrow">{data.eyebrow}</p><h2>{data.title}</h2><p>{data.description}</p></div></div><section className="portal-card utility-list">{data.items.map((item,index)=><button className="utility-row" key={item}><span className="utility-icon"><Icon size={16}/></span><span><strong>{item}</strong><small>{index === 0 ? 'Review the latest workspace information' : 'Open this section to continue'}</small></span><span>›</span></button>)}</section></> }
