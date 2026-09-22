import type { FirChunk, FirPageText } from './fir-types'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const MAX_PDF_BYTES = 20 * 1024 * 1024
export const MAX_TOTAL_CHARS = 120_000

const CHUNK_TARGET_CHARS = 6_000
const MAX_CHUNKS = 10

export class PdfExtractionError extends Error {}

export async function extractPdfPages(
  buffer: Uint8Array
): Promise<{ pages: FirPageText[]; pageCount: number }> {
  let PDFParse: any

  try {
    const pdfParse = await import('pdf-parse')

    PDFParse = pdfParse.PDFParse

    const workerPath = path.join(
      process.cwd(),
      'node_modules',
      'pdfjs-dist',
      'legacy',
      'build',
      'pdf.worker.mjs'
    )

    console.log('PDF worker:', workerPath)

    PDFParse.setWorker(pathToFileURL(workerPath).href)
  } catch (error) {
    console.error('PDF parser initialization failed:', error)

    throw new PdfExtractionError(
      'Unable to initialize the PDF parser. Please run npm install and try again.'
    )
  }

  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()

    const pages: FirPageText[] = (result.pages || []).map(
      (page: { num: number; text: string }) => ({
        num: page.num,
        text: (page.text || '').trim(),
      })
    )

    if (pages.length === 0 && result.text) {
      pages.push({
        num: 1,
        text: result.text.trim(),
      })
    }

    return {
      pages,
      pageCount: result.total || pages.length,
    }
  } catch (error) {
    console.error('PDF extraction failed:', error)

    throw new PdfExtractionError(
      error instanceof Error
        ? error.message
        : 'Failed to read the PDF file'
    )
  } finally {
    await parser.destroy?.().catch(() => undefined)
  }
}

export function chunkPages(
  pages: FirPageText[]
): {
  chunks: FirChunk[]
  truncated: boolean
  totalChars: number
} {
  let totalChars = 0
  let truncated = false

  const chunks: FirChunk[] = []

  let buffer = ''
  let startPage: number | null = null
  let endPage: number | null = null

  const flush = () => {
    if (!buffer.trim() || startPage === null || endPage === null) {
      return
    }

    if (chunks.length >= MAX_CHUNKS) {
      truncated = true
      return
    }

    chunks.push({
      index: chunks.length,
      startPage,
      endPage,
      text: buffer.trim(),
    })

    buffer = ''
    startPage = null
    endPage = null
  }

  for (const page of pages) {
    if (totalChars >= MAX_TOTAL_CHARS) {
      truncated = true
      break
    }

    const remaining = MAX_TOTAL_CHARS - totalChars

    const pageText =
      page.text.length > remaining
        ? page.text.slice(0, remaining)
        : page.text

    if (pageText.length < page.text.length) {
      truncated = true
    }

    totalChars += pageText.length

    if (startPage === null) {
      startPage = page.num
    }

    endPage = page.num

    buffer +=
      (buffer ? '\n\n' : '') +
      `[Page ${page.num}]\n${pageText}`

    if (buffer.length >= CHUNK_TARGET_CHARS) {
      flush()
    }
  }

  flush()

  return {
    chunks,
    truncated,
    totalChars,
  }
}

export function joinPagesAsText(
  pages: FirPageText[]
): string {
  return pages
    .map(
      (page) => `[Page ${page.num}]\n${page.text}`
    )
    .join('\n\n')
}