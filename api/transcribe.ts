import { GoogleGenAI } from '@google/genai';

function createGeminiClient() {
  const candidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
  ];
  let apiKey = '';
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
    if (cleaned && cleaned !== 'MY_GEMINI_API_KEY') {
      apiKey = cleaned;
      break;
    }
  }
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      audioBase64?: string;
      mimeType?: string;
      language?: string;
    };

    const audioBase64 =
      typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : '';
    const rawMime =
      typeof body?.mimeType === 'string' ? body.mimeType.split(';')[0].trim() : '';
    const mimeType = rawMime || 'audio/webm';
    const language = typeof body?.language === 'string' ? body.language.trim() : '';

    if (!audioBase64) {
      return Response.json({ error: 'Audio data is required.' }, { status: 400 });
    }

    const ai = createGeminiClient();
    if (!ai) {
      return Response.json(
        { error: 'Voice transcription backend is not configured yet.' },
        { status: 503 }
      );
    }

    const langHint = language ? ` Primary language hint: ${language}.` : '';
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: `Transcribe the spoken words accurately with natural punctuation. Output ONLY the transcribed words and nothing else.${langHint}`,
          },
        ],
      },
    });

    const text = (response.text ?? '').trim();
    return Response.json({ text });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to transcribe audio.';
    return Response.json({ error: message }, { status: 502 });
  }
}
