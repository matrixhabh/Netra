import { NextResponse } from 'next/server'
import { analyzeFirChunks } from '@/lib/ai/fir-analyze-server'
import { chunkPages, extractPdfPages, joinPagesAsText, MAX_PDF_BYTES, PdfExtractionError } from '@/lib/ai/fir-pdf'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data with a "file" field.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No PDF file was provided.' }, { status: 400 })
  }
  if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 })
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: `File is too large. The limit is ${Math.round(MAX_PDF_BYTES / (1024 * 1024))} MB.` }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())

  try {
    const { pages, pageCount } = await extractPdfPages(buffer)
    const readablePages = pages.filter((page) => page.text.trim().length > 0)
    if (readablePages.length === 0) {
      return NextResponse.json(
        { error: 'No selectable text could be found in this PDF. It may be a scanned image without OCR — try a text-based export.' },
        { status: 422 },
      )
    }

    const { chunks, truncated, totalChars } = chunkPages(readablePages)
    const analysis = await analyzeFirChunks(file.name, chunks, pageCount, truncated, totalChars)
    const documentText = joinPagesAsText(readablePages)

    return NextResponse.json({ analysis, documentText })
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    console.error('FIR analysis failed', error)
    return NextResponse.json({ error: 'Something went wrong while analyzing this document. Please try again.' }, { status: 500 })
  }
}
