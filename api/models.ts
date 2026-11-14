const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface NormalizedOpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  isFree: boolean;
}

interface OpenRouterApiModel {
  id?: string;
  name?: string;
  context_length?: number;
  endpoints?: string[];
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };
}

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

function isRestrictedHarnessModel(id: string): boolean {
  return id.endsWith(':batch') || id.startsWith('thinkingmachines/');
}

function normalizeOpenRouterModels(rawList: OpenRouterApiModel[]): NormalizedOpenRouterModel[] {
  const normalized: NormalizedOpenRouterModel[] = [];
  const seen = new Set<string>();

  for (const item of rawList) {
    const id = typeof item?.id === 'string' ? item.id.trim() : '';
    if (!id || seen.has(id) || isRestrictedHarnessModel(id)) continue;

    if (
      Array.isArray(item?.endpoints) &&
      item.endpoints.length > 0 &&
      !item.endpoints.includes('/api/v1/chat/completions')
    ) {
      continue;
    }

    seen.add(id);

    const slashIndex = id.indexOf('/');
    const provider = slashIndex > 0 ? id.slice(0, slashIndex) : 'openrouter';
    const rawName = typeof item?.name === 'string' && item.name.trim() ? item.name.trim() : id;
    const contextLength =
      typeof item?.context_length === 'number' && Number.isFinite(item.context_length)
        ? item.context_length
        : 0;

    const promptPrice = Number(item?.pricing?.prompt ?? 1);
    const completionPrice = Number(item?.pricing?.completion ?? 1);
    const isFree =
      id.endsWith(':free') ||
      (Number.isFinite(promptPrice) &&
        Number.isFinite(completionPrice) &&
        promptPrice === 0 &&
        completionPrice === 0);

    normalized.push({
      id,
      name: rawName,
      provider,
      contextLength,
      isFree,
    });
  }

  normalized.sort((a, b) => {
    if (a.id === 'openrouter/auto') return -1;
    if (b.id === 'openrouter/auto') return 1;
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return normalized;
}

export async function GET(request: Request): Promise<Response> {
  const openRouterKey = getOpenRouterApiKey();
  const geminiConfigured = Boolean(getGeminiApiKey());

  try {
    const reqUrl = new URL(request.url);
    const referer = process.env.APP_URL || `${reqUrl.protocol}//${reqUrl.host}`;
    const headers: Record<string, string> = {
      'HTTP-Referer': referer,
      'X-Title': 'AI Craft',
    };
    if (openRouterKey) {
      headers.Authorization = `Bearer ${openRouterKey}`;
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `Failed to fetch OpenRouter models (${response.status})${errText ? `: ${errText.slice(0, 140)}` : ''}`
      );
    }

    const json = (await response.json()) as { data?: OpenRouterApiModel[] };
    const rawList = Array.isArray(json?.data) ? json.data : [];
    const models = normalizeOpenRouterModels(rawList);

    return Response.json(
      {
        models,
        openRouterConfigured: Boolean(openRouterKey),
        geminiConfigured,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to load OpenRouter models.';
    const fallbackModels: NormalizedOpenRouterModel[] = geminiConfigured
      ? [
          {
            id: 'google/gemini-4-hydrogen',
            name: 'Google: Gemini 4 Hydrogen',
            provider: 'google',
            contextLength: 1048576,
            isFree: false,
          },
        ]
      : [];

    return Response.json(
      {
        models: fallbackModels,
        openRouterConfigured: Boolean(openRouterKey),
        geminiConfigured,
        error: fallbackModels.length > 0 ? undefined : message,
      },
      {
        status: fallbackModels.length > 0 ? 200 : 502,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
