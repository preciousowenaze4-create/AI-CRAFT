import { getSupabaseConfig } from './_supabaseAuth.js';

function cleanEnvKey(raw: string | undefined, placeholders: string[]): string {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^bearer\s+/i, '').trim();
  }
  if (!cleaned || placeholders.includes(cleaned)) return '';
  return cleaned;
}

function getOpenRouterApiKey(): string {
  const candidates = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPEN_ROUTER_API_KEY,
    process.env.OPENROUTER_KEY,
    process.env.OPENROUTER_API,
    process.env.OPENROUTER_TOKEN,
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    process.env.VITE_OPENROUTER_API_KEY,
  ];
  for (const raw of candidates) {
    const cleaned = cleanEnvKey(raw, ['MY_OPENROUTER_API_KEY']);
    if (!cleaned || cleaned.startsWith('AIza')) continue;
    return cleaned;
  }
  const apiKey = cleanEnvKey(process.env.API_KEY, ['MY_OPENROUTER_API_KEY']);
  if (apiKey.startsWith('sk-or-')) return apiKey;
  return '';
}

function getGeminiApiKey(): string {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
  ];
  for (const raw of candidates) {
    const cleaned = cleanEnvKey(raw, ['MY_GEMINI_API_KEY']);
    if (cleaned) return cleaned;
  }
  return '';
}

export async function GET(): Promise<Response> {
  const sbConfig = getSupabaseConfig();
  return Response.json(
    {
      ok: true,
      openRouterConfigured: Boolean(getOpenRouterApiKey()),
      geminiConfigured: Boolean(getGeminiApiKey()),
      supabaseConfigured: Boolean(sbConfig.url && sbConfig.anonKey),
      vercelEnv: process.env.VERCEL_ENV || null,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
