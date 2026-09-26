import { put } from '@vercel/blob'
import { desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { evidence } from '@/lib/db/schema'
import { headers } from 'next/headers'

const MAX_FILE_SIZE = 100 * 1024 * 1024

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  return session.user
}

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const caseId = new URL(request.url).searchParams.get('caseId')?.trim()
  if (!caseId) return NextResponse.json({ error: 'Missing caseId' }, { status: 400 })
  const rows = await db.select().from(evidence).where(eq(evidence.caseId, caseId)).orderBy(desc(evidence.uploadedAt))
  return NextResponse.json({ evidence: rows })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const formData = await request.formData()
  const caseId = String(formData.get('caseId') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim().slice(0, 180)
  const description = String(formData.get('description') ?? '').trim().slice(0, 500)
  const file = formData.get('file')
  if (!caseId || !(file instanceof File)) return NextResponse.json({ error: 'Case and file are required' }, { status: 400 })
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File must be between 1 byte and 100 MB' }, { status: 400 })

  const evidenceId = `EV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'evidence-file'
  const storagePath = `evidence/${caseId}/${evidenceId}-${safeName}`
  const blob = await put(storagePath, file, { access: 'private', addRandomSuffix: false })
  const [created] = await db.insert(evidence).values({
    id: evidenceId,
    caseId,
    originalFilename: file.name,
    title: title || file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    storagePath: blob.pathname,
    uploadedBy: user.name || user.email,
    description: description || null,
  }).returning()
  return NextResponse.json({ evidence: created }, { status: 201 })
}
