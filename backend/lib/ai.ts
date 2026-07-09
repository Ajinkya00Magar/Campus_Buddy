/**
 * Provider-agnostic LLM client (server-only). Pick the provider with AI_PROVIDER
 * and supply the matching key. If no key is set, aiReady() is false and callers
 * degrade gracefully (features stay hidden / no-op) — nothing crashes.
 *
 *   AI_PROVIDER = anthropic | openai | gemini   (default: anthropic)
 *   ANTHROPIC_API_KEY=...            ANTHROPIC_MODEL=claude-sonnet-5 (optional)
 *   OPENAI_API_KEY=...               OPENAI_MODEL=gpt-4o-mini (optional)
 *   GEMINI_API_KEY=...               GEMINI_MODEL=gemini-1.5-flash (optional)
 */

export type AiProvider = 'anthropic' | 'openai' | 'gemini'

function provider(): AiProvider {
  const p = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
  return p === 'openai' || p === 'gemini' ? p : 'anthropic'
}

function keyFor(p: AiProvider): string | undefined {
  if (p === 'anthropic') return process.env.ANTHROPIC_API_KEY
  if (p === 'openai') return process.env.OPENAI_API_KEY
  return process.env.GEMINI_API_KEY
}

export function aiReady(): boolean {
  return !!keyFor(provider())
}

export interface CompletionOptions {
  system?: string
  prompt: string
  maxTokens?: number
  temperature?: number
}

/** Run a single-turn completion against the configured provider. Throws if not configured. */
export async function aiComplete({ system, prompt, maxTokens = 600, temperature = 0.3 }: CompletionOptions): Promise<string> {
  const p = provider()
  const key = keyFor(p)
  if (!key) throw new Error('AI is not configured')

  if (p === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)
    const data = await res.json()
    return (data?.content?.[0]?.text ?? '').trim()
  }

  if (p === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`)
    const data = await res.json()
    return (data?.choices?.[0]?.message?.content ?? '').trim()
  }

  // gemini
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error ${res.status}`)
  const data = await res.json()
  return (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
}
