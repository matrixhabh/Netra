import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { evidence } from '@/lib/db/schema'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const params = new URL(request.url).searchParams
  const id = params.get('id')?.trim()
  const download = params.get('download') === '1'
  if (!id) return NextResponse.json({ error: 'Missing evidence id' }, { status: 400 })
  const [record] = await db.select().from(evidence).where(eq(evidence.id, id)).limit(1)
  if (!record) return NextResponse.json({ error: 'Evidence not found' }, { status: 404 })
  const result = await get(record.storagePath, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') ?? undefined })
  if (!result) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
  return new NextResponse(result.stream, { headers: { 'Content-Type': record.mimeType, 'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(record.originalFilename)}`, ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } })
}
