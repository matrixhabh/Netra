export type CaseStatus = 'In Investigation' | 'Under Review' | 'Resolved' | 'New'
export type CasePriority = 'High' | 'Medium' | 'Low'

export type InvestigationCase = {
  id: string
  title: string
  type: string
  complainant: string
  amount: string
  reportedOn: string
  location: string
  assignedTo: string
  status: CaseStatus
  priority: CasePriority
  updatedAt: string
  summary: string
}

export type EvidenceItem = { id: string; name: string; type: string; status: string; addedBy: string; addedAt: string }
export type Entity = { id: string; label: string; type: string; value: string; confidence: string }
export type TimelineEvent = { id: string; date: string; title: string; detail: string; actor: string; kind: 'report' | 'evidence' | 'analysis' | 'status' }
export type AuditEvent = { id: string; action: string; actor: string; timestamp: string; detail: string }

export const cases: InvestigationCase[] = [
  { id: 'C-1042', title: 'UPI Fraud Investigation', type: 'Financial Fraud', complainant: 'Ananya Sharma', amount: '₹85,000', reportedOn: '02 Sep 2026', location: 'Pune, Maharashtra', assignedTo: 'Cyber Crime Unit', status: 'In Investigation', priority: 'High', updatedAt: '18 min ago', summary: 'Unauthorised UPI transaction following a suspicious SMS link. Three potential linked entities identified for review.' },
  { id: 'C-1038', title: 'Phishing Network — FinServe', type: 'Phishing', complainant: 'Rohan Mehta', amount: '₹42,500', reportedOn: '01 Sep 2026', location: 'Bengaluru, Karnataka', assignedTo: 'Digital Forensics', status: 'Under Review', priority: 'High', updatedAt: '1 hr ago', summary: 'Credential-harvesting domain impersonating a financial services provider.' },
  { id: 'C-1036', title: 'Marketplace Payment Dispute', type: 'Online Fraud', complainant: 'Priya Nair', amount: '₹18,200', reportedOn: '31 Aug 2026', location: 'Kochi, Kerala', assignedTo: 'Cyber Crime Unit', status: 'New', priority: 'Medium', updatedAt: '3 hrs ago', summary: 'Payment dispute involving a seller account and multiple delivery addresses.' },
  { id: 'C-1029', title: 'Account Takeover Pattern', type: 'Identity Theft', complainant: 'Vikram Rao', amount: '₹12,000', reportedOn: '28 Aug 2026', location: 'Hyderabad, Telangana', assignedTo: 'Threat Intelligence', status: 'In Investigation', priority: 'Medium', updatedAt: 'Yesterday', summary: 'Repeated login attempts and SIM-swap indicators across two devices.' },
  { id: 'C-1014', title: 'Investment Scam Report', type: 'Financial Fraud', complainant: 'Meera Iyer', amount: '₹2,40,000', reportedOn: '22 Aug 2026', location: 'Chennai, Tamil Nadu', assignedTo: 'Cyber Crime Unit', status: 'Resolved', priority: 'Low', updatedAt: '3 days ago', summary: 'Ponzi-style investment group identified and closed after evidence review.' },
]

export const evidenceByCase: Record<string, EvidenceItem[]> = {
  'C-1042': [
    { id: 'EV-8821', name: 'UPI transaction receipt.pdf', type: 'Document', status: 'Verified', addedBy: 'A. Kulkarni', addedAt: '02 Sep 2026, 11:42' },
    { id: 'EV-8822', name: 'Suspicious SMS screenshot.png', type: 'Image', status: 'Verified', addedBy: 'A. Kulkarni', addedAt: '02 Sep 2026, 11:44' },
    { id: 'EV-8823', name: 'upi-helpdesk[.]in capture.html', type: 'Web capture', status: 'Under review', addedBy: 'Threat Intel', addedAt: '02 Sep 2026, 13:08' },
  ],
}

export const entitiesByCase: Record<string, Entity[]> = {
  'C-1042': [
    { id: 'EN-101', label: 'Complainant', type: 'Person', value: 'Ananya Sharma', confidence: 'Verified' },
    { id: 'EN-102', label: 'Phone number', type: 'Phone', value: '+91 98••• 4421', confidence: 'High' },
    { id: 'EN-103', label: 'UPI ID', type: 'Payment', value: 'ananya.s@upi', confidence: 'Verified' },
    { id: 'EN-104', label: 'Suspicious domain', type: 'Domain', value: 'upi-helpdesk[.]in', confidence: 'High' },
    { id: 'EN-105', label: 'IP address', type: 'Network', value: '103.82.14.••', confidence: 'Medium' },
  ],
}

export const timelineByCase: Record<string, TimelineEvent[]> = {
  'C-1042': [
    { id: 'TL-1', date: '02 Sep 2026 · 10:18', title: 'Complaint submitted', detail: 'Initial complaint and transaction receipt received through the citizen reporting channel.', actor: 'Citizen Portal', kind: 'report' },
    { id: 'TL-2', date: '02 Sep 2026 · 11:42', title: 'Evidence added', detail: 'UPI receipt and suspicious SMS screenshot added to the evidence register.', actor: 'A. Kulkarni', kind: 'evidence' },
    { id: 'TL-3', date: '02 Sep 2026 · 13:08', title: 'Domain linked', detail: 'Threat intelligence review linked the reported URL to a known impersonation pattern.', actor: 'Threat Intel', kind: 'analysis' },
    { id: 'TL-4', date: '02 Sep 2026 · 14:20', title: 'Case assigned', detail: 'Case assigned to Cyber Crime Unit for coordinated investigation.', actor: 'Duty Officer', kind: 'status' },
  ],
}

export const auditByCase: Record<string, AuditEvent[]> = {
  'C-1042': [
    { id: 'AU-1', action: 'Case created', actor: 'Citizen Portal', timestamp: '02 Sep 2026 · 10:18', detail: 'Initial case record created.' },
    { id: 'AU-2', action: 'Evidence uploaded', actor: 'A. Kulkarni', timestamp: '02 Sep 2026 · 11:42', detail: 'UPI transaction receipt.pdf' },
    { id: 'AU-3', action: 'Assignment changed', actor: 'Duty Officer', timestamp: '02 Sep 2026 · 14:20', detail: 'Assigned to Cyber Crime Unit.' },
  ],
}

export function getCase(caseId: string) { return cases.find((item) => item.id === caseId) ?? cases[0] }
export function getEvidence(caseId: string) { return evidenceByCase[caseId] ?? [] }
export function getEntities(caseId: string) { return entitiesByCase[caseId] ?? [] }
export function getTimeline(caseId: string) { return timelineByCase[caseId] ?? [] }
export function getAudit(caseId: string) { return auditByCase[caseId] ?? [] }
