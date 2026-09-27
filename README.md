# NETRA

## Networked Evidence, Tracking & Response Assistant

> **From fragmented evidence to connected intelligence.**
>
> NETRA is an investigator-facing cybercrime intelligence workspace that
> connects evidence, entities and relationships into a unified
> investigation workflow --- while keeping the human investigator in
> control.

**SIH 2026 · Problem Statement SIH26189 · Blockchain & Cybersecurity**

**Live Demo:** https://netra-ruby.vercel.app\
**GitHub:** https://github.com/matrixhabh/Netra\
**Demo / YouTube:** https://www.youtube.com/@r7yuma

------------------------------------------------------------------------

# 🛡️ SIH 2026 --- THE PROBLEM

## AI-Powered Criminal Network Analysis System

**Problem Statement:** `SIH26189`\
**Theme:** Blockchain & Cybersecurity\
**Category:** Software

Modern cybercrime investigations generate evidence across fragmented
sources such as FIRs, CDRs, financial records, digital devices, social
media, surveillance information, phone numbers, bank accounts, vehicles,
addresses and intelligence databases.

The challenge is not simply collecting information. **The challenge is
connecting it.**

When evidence is distributed across different sources and cases,
investigators may need to manually correlate entities and relationships
to discover hidden connections, common identifiers, cross-case
relationships, suspicious patterns, high-risk entities, central actors
and bridge entities.

This creates a time-consuming workflow and makes relationship discovery
difficult at scale.

------------------------------------------------------------------------

# ⚠️ THE INVESTIGATION GAP

## Evidence exists. Connections are buried.

A traditional investigation can look like:

``` text
FIR ──┬── Person
      ├── Phone
      ├── Vehicle
      ├── Bank Account
      └── Address

CDR ── Phone A ─── Phone B ─── Phone C

Financial Records ── Account A ─── Account B

Digital Intelligence ── Identity ── Device ── Account
```

The investigator must determine whether these fragments belong to the
same operational network.

### NETRA changes the workflow.

``` text
CASE
  ↓
EVIDENCE
  ↓
ENTITY EXTRACTION
  ↓
RELATIONSHIP ANALYSIS
  ↓
NETWORK INTELLIGENCE
  ↓
INVESTIGATOR REVIEW
  ↓
CASE ACTION
```

------------------------------------------------------------------------

# 🧠 THE NETRA APPROACH

## Complex investigation technology underneath. Simple interface on top.

NETRA is designed as an **investigator-facing intelligence platform**,
not an autonomous decision-maker.

### 01 --- Case-Centric Investigation

Every investigation begins with a case and a unified workspace
containing:

-   Case overview
-   Evidence
-   Entities
-   Relationships
-   Timeline
-   Intelligence
-   Notes
-   Audit information

### 02 --- Universal Evidence Register

Investigators can:

-   Upload evidence
-   Organize evidence
-   Preview supported file types
-   Download evidence
-   Track metadata
-   Maintain evidence status
-   Associate evidence with a case
-   Record important evidence actions

Supported demonstration formats include PDF, images, audio, video, text,
CSV and JSON.

### 03 --- FIR Intelligence

The FIR Analyzer turns an investigation document into structured context
through:

-   Document summary
-   Key facts
-   Extracted entities
-   Relationships / connections
-   Investigation intelligence
-   Evidence/source references
-   Contextual questions

------------------------------------------------------------------------

# 🕸️ 3D CRIMINAL NETWORK INTELLIGENCE

## See the network. Find the connection.

NETRA provides an interactive 3D relationship graph for complex
investigation networks.

### Entities can represent

-   Persons
-   Phone numbers
-   Vehicles
-   Bank accounts
-   Devices
-   Organizations
-   Digital identifiers
-   Other investigation objects

### Relationships can represent

-   Communication
-   Ownership
-   Financial movement
-   Association
-   Shared infrastructure
-   Operational links
-   Cross-case connections

Instead of viewing evidence as isolated records, investigators can
inspect it as a connected intelligence network.

------------------------------------------------------------------------

# 🔎 INTELLIGENCE ANALYTICS

The Intelligence HUD provides investigation-oriented analytics
including:

### Network Topology

-   Total entities
-   Relationships
-   Network density
-   Detected clusters

### Risk Assessment

-   Critical-risk entities
-   High-risk entities
-   Risk scores

### Network Intelligence

-   Influencers
-   Bridge entities
-   Network patterns
-   Suspicious relationships
-   Cross-cluster connections
-   Investigation alerts

### Why bridge entities matter

A bridge entity can connect otherwise separated groups. Identifying such
relationships can help investigators understand how different clusters
may be connected.

------------------------------------------------------------------------

# 🖼️ ENTITY MEDIA

Investigation networks are not always easiest to understand through
abstract shapes alone.

NETRA supports visual entity references. Investigators can attach an
image to a person, vehicle or other investigation object.

``` text
Image available
      ↓
Visual entity reference

No image available
      ↓
Existing graph representation
```

This preserves the existing graph visualization while adding useful
visual context when available.

------------------------------------------------------------------------

# 🤖 INVESTIGATION ASSISTANT

NETRA includes an investigator-facing AI assistant designed to support
investigation workflows such as:

-   Understanding investigation data
-   Summarizing evidence
-   Finding relevant connections
-   Explaining relationships
-   Supporting investigative reasoning
-   Providing contextual guidance

### Human review remains mandatory.

``` text
AI-assisted analysis
        ↓
Investigator review
        ↓
Human decision
        ↓
Case action
```

NETRA does not attempt to replace investigators or make autonomous
investigative decisions.

------------------------------------------------------------------------

# 🌐 MULTILINGUAL BY DESIGN

Target language support:

-   English
-   Hindi
-   Marathi

The architecture separates UI localization from the multilingual
investigation-assistant layer so both can evolve independently.

------------------------------------------------------------------------

# 🔐 SECURITY & ACCESS CONTROL

NETRA follows the principle:

> **A user should only access investigation data they are authorized to
> access.**

### Authentication

Officer access is authenticated.

### Case-scoped authorization

Investigation data is associated with specific cases.

### Role-based access

  Role                   Access
  ---------------------- --------------------------------------------------------
  Investigator           View, upload and contribute to assigned case data
  Supervisor             Investigator permissions + controlled evidence removal
  Owner / Case Handler   Full case administration

### Evidence protection

Evidence access is protected through authentication, case membership,
role-based permissions, private storage access and server-side
authorization.

### Audit trail

Important evidence actions such as removal are recorded in an audit
trail.

------------------------------------------------------------------------

# 👮 INVESTIGATION ACCESS MODEL

``` text
Case Handler
     │
     │ invites
     ▼
Investigator
     │
     │ accepts
     ▼
Case Membership
     │
     ▼
Authorized Case Access
```

### Planned invitation workflow

``` text
Case Handler
     ↓
Secure email invitation
     ↓
Expiring single-use token
     ↓
Officer accepts
     ↓
Authentication / account creation
     ↓
Case membership created
     ↓
Case-scoped access
```

Credentials are never intended to be shared through invitations.

------------------------------------------------------------------------

# 🏗️ SYSTEM ARCHITECTURE

``` text
                         ┌─────────────────────┐
                         │     NETRA WEB UI    │
                         │ Next.js + React     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      NETRA API      │
                         │ Auth / Cases /      │
                         │ Evidence / Data     │
                         └──────────┬──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
          ┌────────────────────┐       ┌────────────────────┐
          │ Investigation      │       │ Evidence &         │
          │ Intelligence       │       │ Case Services      │
          └──────────┬─────────┘       └─────────┬──────────┘
                     │                           │
                     ▼                           ▼
          ┌────────────────────┐       ┌────────────────────┐
          │ Retrieval /        │       │ PostgreSQL / Neon  │
          │ Knowledge Layer    │       │ + Vercel Blob      │
          └──────────┬─────────┘       └────────────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │ Self-hosted /      │
          │ Domain-adapted AI  │
          │ Model              │
          └────────────────────┘
```

The frontend remains provider-agnostic. The long-term intelligence layer
can connect to a self-hosted/domain-adapted model through NETRA's own
API.

------------------------------------------------------------------------

# 🧩 AI STRATEGY

NETRA's intended AI architecture is:

``` text
NETRA Frontend
      ↓
NETRA API
      ↓
Investigation Intelligence Service
      ↓
Retrieval / Knowledge Layer
      ↓
Domain-adapted Model
      ↓
Investigation Response
```

The long-term direction is to adapt an open-source foundation model
using a curated cybersecurity/cybercrime investigation dataset and
self-host the resulting model behind NETRA's own inference API.

> **NETRA does not claim to have trained a foundation model from
> scratch.**
>
> The intended approach is **domain adaptation + retrieval + self-hosted
> inference + investigator-controlled review.**

------------------------------------------------------------------------

# 🧰 TECHNOLOGY STACK

### Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS
-   Responsive CSS
-   Lucide Icons

### 3D Intelligence Visualization

-   Three.js
-   React Force Graph 3D

### Backend / APIs

-   Next.js API Routes
-   REST-style endpoints

### Database

-   PostgreSQL
-   Neon
-   Drizzle ORM

### Authentication

-   Better Auth
-   Google OAuth

### Evidence Storage

-   Vercel Blob
-   Private evidence access

### AI Layer

-   Provider-agnostic architecture
-   Retrieval-Augmented Generation (RAG)
-   Domain-adapted / self-hosted model architecture

### Deployment

-   Vercel
-   GitHub

------------------------------------------------------------------------

# 🎯 KEY FEATURES

  Feature                           Status
  --------------------------------- -----------------------
  Officer Authentication            ✅
  Case Management                   ✅
  Case-scoped Access                ✅
  Role-based Permissions            ✅
  Universal Evidence Register       ✅
  Evidence Viewer                   ✅
  Evidence Download                 ✅
  Evidence Removal                  ✅
  Evidence Audit Trail              ✅
  FIR Analyzer                      ✅
  Entity Intelligence               ✅
  Relationship Analysis             ✅
  3D Criminal Network               ✅
  Network Analytics                 ✅
  Entity Media / Images             ✅
  Entity Image Upload               ✅
  Investigation Assistant           ✅
  Multilingual Architecture         ✅
  Responsive Officer Portal         ✅
  Mobile Intelligence HUD           ✅
  Self-hosted AI Architecture       🧠 Architecture Ready
  Secure Officer Invitations        🚧 Planned
  Production Domain-adapted Model   🚧 Planned

------------------------------------------------------------------------

# 🧪 DEMO DATA

NETRA currently uses **synthetic investigation data** for demonstration.

This is intentional: real cybercrime investigation data can contain
highly sensitive information and cannot simply be used in a student
hackathon environment.

Synthetic data allows the platform to demonstrate entity relationships,
network structures, investigation workflows, evidence handling, risk
analytics, cross-case intelligence and AI-assisted investigation
concepts without exposing real victims, suspects or confidential
investigation records.

------------------------------------------------------------------------

# 🚀 QUICK START

## Prerequisites

-   Node.js
-   pnpm
-   Git

Verify:

``` bash
node -v
pnpm -v
git --version
```

## Clone

``` bash
git clone https://github.com/matrixhabh/Netra.git
cd Netra
```

## Install dependencies

``` bash
pnpm install
```

## Environment variables

Create `.env.local`:

``` env
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

DATABASE_URL=your_database_url
DATABASE_URL_UNPOOLED=your_unpooled_database_url

BLOB_READ_WRITE_TOKEN=your_blob_token
```

> **Never commit `.env.local`, OAuth secrets, database credentials, Blob
> tokens or API keys.**

## Start development

``` bash
pnpm dev
```

Open `http://localhost:3000`.

------------------------------------------------------------------------

# 🏭 PRODUCTION BUILD & VALIDATION

``` bash
pnpm exec tsc --noEmit
pnpm build
pnpm start
```

Before committing:

``` bash
git diff --check
```

------------------------------------------------------------------------

# 🔑 SIH JUDGE DEMO ACCESS

> \[!WARNING\] **TEMPORARY SIH DEMO CREDENTIALS**
>
> These credentials are intended only for the SIH evaluation
> environment. **Remove, rotate or disable them after SIH 2026.**

### Judge Account -> USE THIS

``` text
Login:
judge@gmail.com

Password:
Judge@123
```

> Replace the placeholders above with the actual disposable judge
> credentials before publishing the final README. Do not put OAuth
> client secrets, database passwords, Blob tokens or `.env.local`
> contents here.

### Demo Case

``` text
Case ID: C-1042
```

### Recommended Judge Flow

``` text
Sign In
   ↓
Officer Portal
   ↓
Cases
   ↓
C-1042
   ↓
Evidence
   ↓
Entities
   ↓
Relationships
   ↓
Intelligence
   ↓
3D Criminal Network
   ↓
FIR Analyzer
   ↓
Investigation Assistant
```

### Suggested 3-minute walkthrough

**1. Authentication** --- Show secure officer sign-in.

**2. Case Workspace** --- Open `C-1042` and explain the case-centric
workflow.

**3. Evidence** --- Demonstrate preview, upload, download and metadata.

**4. Entity Intelligence** --- Select an entity and show risk,
relationships, cluster information and media.

**5. 3D Network** --- Open **Intelligence → Criminal Syndicate Knowledge
Graph** and demonstrate clusters, bridge entities, risk indicators and
the Intelligence HUD.

**6. Investigation Assistant** --- Ask a contextual investigation
question and emphasize:

> **"NETRA assists the investigator --- it does not replace the
> investigator."**

------------------------------------------------------------------------

# 📱 RESPONSIVE INVESTIGATION EXPERIENCE

The Intelligence interface adapts to smaller screens so the 3D graph
remains usable rather than being permanently covered by analytics
panels.

``` text
Desktop
┌──────────────────────────────┐
│ Intelligence HUD │ 3D Graph  │
│                 │            │
│                 │            │
└──────────────────────────────┘

Mobile
┌──────────────────┐
│ >                │
│                  │
│     3D GRAPH     │
│                  │
└──────────────────┘

Tap >
  ↓

┌──────────────────┐
│ < Intelligence   │
│   HUD            │
│                  │
│   Analytics      │
│   Alerts         │
└──────────────────┘
```

------------------------------------------------------------------------

# 🧭 INVESTIGATION WORKFLOW

``` text
AUTHENTICATE
     ↓
CREATE / SELECT CASE
     ↓
COLLECT EVIDENCE
     ↓
ORGANIZE EVIDENCE
     ↓
EXTRACT ENTITIES
     ↓
CONNECT RELATIONSHIPS
     ↓
ANALYZE NETWORK
     ↓
IDENTIFY PATTERNS
     ↓
REVIEW INTELLIGENCE
     ↓
INVESTIGATOR DECISION
     ↓
CASE ACTION / REPORT
     ↓
AUDIT
```

------------------------------------------------------------------------

# 🔬 FEASIBILITY

### 1. Modular architecture

Authentication, evidence, case management, intelligence and AI services
can evolve independently.

### 2. Mature technology

NETRA uses established web, database, authentication and visualization
technologies.

### 3. Synthetic-data development

Development and demonstration do not require access to confidential
investigation datasets.

### 4. Self-hosted intelligence

The intelligence layer can eventually run on controlled infrastructure
rather than depending entirely on external AI providers.

### 5. Scalable foundation

The case-scoped data model allows additional investigations, officers
and intelligence sources to be incorporated progressively.

------------------------------------------------------------------------

# 📈 EXPECTED IMPACT

NETRA targets improvements such as:

-   Reduced manual correlation effort
-   Faster identification of relevant relationships
-   Better cross-case visibility
-   Improved visualization of complex networks
-   Faster evidence discovery
-   More structured investigation workflows
-   Better auditability
-   Human-in-the-loop AI assistance

> Performance targets such as analysis-time reduction and increased
> relevant-connection discovery are **projected targets for future pilot
> validation**, not claims of already-measured production performance.

------------------------------------------------------------------------

# 🛡️ SECURITY PRINCIPLES

### Least privilege

Users should only access cases and evidence for which they are
authorized.

### Case isolation

Evidence access is tied to case membership.

### Role-based permissions

Destructive actions such as evidence removal are restricted.

### Private evidence storage

Sensitive uploaded evidence is not intended to be publicly accessible.

### Auditability

Important evidence actions can be recorded.

### Human oversight

AI outputs are treated as investigative assistance rather than
autonomous decisions.

### Secret protection

Credentials, API keys and database connection strings belong in
environment variables and must never be committed to source control.

------------------------------------------------------------------------

# 🧠 WHAT MAKES NETRA DIFFERENT?

NETRA is not simply:

``` text
❌ A chatbot
❌ A file uploader
❌ A generic dashboard
❌ A static crime database
❌ An autonomous "AI police officer"
```

Instead:

``` text
                    NETRA
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
     EVIDENCE      ENTITIES      NETWORKS
        │             │             │
        └─────────────┼─────────────┘
                      ▼
               INTELLIGENCE
                      │
                      ▼
                AI ASSISTANCE
                      │
                      ▼
              HUMAN INVESTIGATOR
```

> **NETRA connects the dots investigators shouldn't have to find
> manually.**

------------------------------------------------------------------------

# 🧱 CURRENT LIMITATIONS

NETRA is a hackathon prototype and should be evaluated accordingly.

Current limitations include:

-   Demonstration data is synthetic.
-   Some intelligence outputs are prototype/demo-oriented.
-   Full production-scale AI model deployment is future work.
-   Secure officer invitation workflow is planned.
-   Domain-specific model training requires a curated real-world or
    appropriately anonymized dataset.
-   Production deployment would require additional hardening, monitoring
    and operational security controls.
-   Current entity image persistence is designed for the prototype
    experience rather than a complete digital-evidence media management
    system.

These limitations are part of the roadmap rather than hidden from
evaluation.

------------------------------------------------------------------------

# 🚀 ROADMAP

## Phase 1 --- Investigation Foundation

-   Authentication
-   Officer portal
-   Case management
-   Evidence register
-   Role-based access

## Phase 2 --- Investigation Intelligence

-   Entity extraction
-   Relationship mapping
-   3D network visualization
-   Risk analytics
-   Entity media
-   FIR analysis
-   Investigation assistant

## Phase 3 --- Intelligence Platform

-   Secure officer invitations
-   Cross-case correlation
-   Advanced evidence intelligence
-   Investigation timelines
-   Advanced audit systems
-   Multilingual intelligence

## Phase 4 --- Domain AI

-   Curated cybersecurity investigation dataset
-   Domain adaptation
-   Retrieval pipeline
-   Model evaluation
-   Self-hosted inference
-   NETRA Intelligence API

## Phase 5 --- Operational Deployment

-   Hardened infrastructure
-   Monitoring
-   Advanced access controls
-   Security testing
-   Deployment policies
-   Controlled institutional integration

------------------------------------------------------------------------

# 📂 PROJECT STRUCTURE

``` text
Netra/
│
├── app/
│   ├── api/
│   │   ├── analyze/
│   │   ├── ask/
│   │   ├── auth/
│   │   └── evidence/
│   │
│   ├── officer/
│   │   ├── cases/
│   │   ├── docs/
│   │   ├── entities/
│   │   ├── evidence/
│   │   ├── fir-analyzer/
│   │   ├── intelligence/
│   │   └── settings/
│   │
│   ├── sign-in/
│   ├── sign-up/
│   └── page.tsx
│
├── components/
│   ├── NetworkGraph/
│   │   ├── CriminalNetwork3D.tsx
│   │   ├── EntityDetails.tsx
│   │   ├── NetworkFilters.tsx
│   │   ├── NetworkGraphContainer.tsx
│   │   ├── NetworkSearch.tsx
│   │   └── NetworkSidebar.tsx
│   │
│   ├── evidence-register.tsx
│   ├── fir-analyzer.tsx
│   ├── investigation-assistant.tsx
│   └── officer-portal.tsx
│
├── lib/
│   ├── ai/
│   ├── data/
│   ├── db/
│   └── i18n/
│
├── public/
│   └── demo/
│       └── entities/
│
└── package.json
```

------------------------------------------------------------------------

# 🧑‍💻 DEVELOPMENT PRINCIPLES

### Minimal interface

Investigation software should prioritize information density and clarity
rather than decorative UI.

### Low cognitive load

Complex intelligence should be presented through simple interactions.

### Human-in-the-loop

AI assists investigators rather than replacing them.

### Provider agnostic

The application should not be tightly coupled to a single AI provider.

### Security by architecture

Authorization should exist at the API/data layer, not merely in the
frontend.

### Progressive complexity

Basic information remains immediately accessible while advanced
intelligence is available when needed.

------------------------------------------------------------------------

# 🏆 SIH DEMONSTRATION HIGHLIGHTS

### 🔐 Secure Officer Access

Authenticated investigator workflow.

### 📁 Case Management

Structured case-centric investigation.

### 📎 Evidence Intelligence

Upload, preview, download and manage investigation evidence.

### 🧩 Entity Intelligence

Convert disconnected identifiers into structured entities.

### 🕸️ Relationship Discovery

Visualize connections between entities.

### 🌐 Criminal Network Visualization

Explore a 3D investigation graph.

### 📊 Network Analytics

Identify clusters, bridges, influencers and risk indicators.

### 🖼️ Entity Media

Attach visual references to investigation entities.

### 🤖 Investigation Assistant

Use AI-assisted contextual investigation support.

### 🧾 Auditability

Track important evidence actions.

### 📱 Responsive Investigation

Access investigation intelligence across desktop and mobile layouts.

------------------------------------------------------------------------

# 🎥 DEMO & PROJECT LINKS

### Live Application

https://netra-ruby.vercel.app

### Source Code

https://github.com/matrixhabh/Netra

### Video Demonstration

https://www.youtube.com/@r7yuma

------------------------------------------------------------------------

# 📚 REFERENCES & INSPIRATION

NETRA's investigation and cybersecurity architecture is informed by
established cybersecurity and digital-investigation concepts, including:

-   NIST Cybersecurity Framework
-   NIST Computer Security Incident Handling guidance
-   MITRE ATT&CK
-   National Institute of Justice digital and multimedia evidence
    resources
-   Digital investigation and forensic methodology literature
-   Field research and feedback from cybersecurity investigation
    personnel

------------------------------------------------------------------------

# 👥 TEAM

## Team Entwine

**Project:** NETRA\
**SIH:** Smart India Hackathon 2026\
**Problem Statement:** SIH26189\
**Theme:** Blockchain & Cybersecurity

### Project Vision

> **Build an investigator-first intelligence platform that turns
> fragmented evidence into connected, actionable investigative
> context.**

------------------------------------------------------------------------

# ⚡ THE ONE-LINE PITCH

> **NETRA connects the dots investigators shouldn't have to find
> manually.**

------------------------------------------------------------------------

# 🥷 FINAL PRINCIPLE

> ### **The investigator stays in control.**
>
> NETRA connects the evidence.\
> NETRA reveals the relationships.\
> NETRA assists the analysis.\
> **The investigator makes the decision.**

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<strong>`{=html}NETRA --- Networked Evidence, Tracking & Response
Assistant`</strong>`{=html} `<br/>`{=html} `<sub>`{=html}SIH 2026 ·
SIH26189 · Blockchain & Cybersecurity`</sub>`{=html}
```{=html}
</p>
```
