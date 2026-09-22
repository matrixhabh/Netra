import { NextResponse } from 'next/server'
import { answerFirQuestion } from '@/lib/ai/fir-ask-server'
import type { FirAskRequest } from '@/lib/ai/fir-types'

export const runtime = 'nodejs'
export const maxDuration = 30

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!isRecord(body) || typeof body.question !== 'string' || !body.question.trim()) {
    return NextResponse.json({ error: 'A "question" string is required.' }, { status: 400 })
  }
  if (typeof body.documentText !== 'string' || !body.documentText.trim()) {
    return NextResponse.json({ error: 'Missing "documentText" — analyze the document before asking questions.' }, { status: 400 })
  }
  if (!isRecord(body.analysis)) {
    return NextResponse.json({ error: 'Missing "analysis" — analyze the document before asking questions.' }, { status: 400 })
  }

  const askRequest: FirAskRequest = {
    question: body.question,
    documentText: body.documentText,
    analysis: body.analysis as FirAskRequest['analysis'],
    language: body.language === 'hi' || body.language === 'mr' ? body.language : 'en',
    history: Array.isArray(body.history) ? body.history.slice(-6) : undefined,
  }

  try {
    const response = await answerFirQuestion(askRequest)
    return NextResponse.json(response)
  } catch (error) {
    console.error('FIR question answering failed', error)
    return NextResponse.json({ error: 'Something went wrong while answering that question. Please try again.' }, { status: 500 })
  }
}
