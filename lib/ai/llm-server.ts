// Server-only LLM gateway for NETRA FIR analysis.
// Gemini handles document extraction; Groq handles synthesis and fast Q&A.
// Q&A is verified by Gemini against the source text before it is returned.

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash'
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY)
}

export function areFirLlmsConfigured() {
  return isGeminiConfigured() && isGroqConfigured()
}

type GeminiOptions = {
  system: string
  user: string
  maxOutputTokens?: number
}

export async function callGemini({ system, user, maxOutputTokens = 4000 }: GeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const model = process.env.FIR_GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Gemini API returned ${response.status}: ${detail.slice(0, 300)}`)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim()

  if (!text) throw new Error('Gemini API returned an empty response')
  return text
}

type GroqOptions = {
  system: string
  user: string
  maxTokens?: number
}

export async function callGroq({ system, user, maxTokens = 2000 }: GroqOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured')

  const model = process.env.FIR_GROQ_MODEL || DEFAULT_GROQ_MODEL
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Groq API returned ${response.status}: ${detail.slice(0, 300)}`)
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const text = payload.choices?.[0]?.message?.content?.trim() || ''
  if (!text) throw new Error('Groq API returned an empty response')
  return text
}
