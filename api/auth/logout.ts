import {
  appendClearAuthCookies,
  createBackendSupabaseClient,
} from '../_supabaseAuth.js';

export async function POST(request: Request): Promise<Response> {
  const headers = new Headers();
  appendClearAuthCookies(headers);

  const supabase = createBackendSupabaseClient();
  const authHeader = request.headers.get('authorization') || '';
  const token = /^bearer\s+/i.test(authHeader)
    ? authHeader.replace(/^bearer\s+/i, '').trim()
    : '';
  if (supabase && token) {
    try {
      await supabase.auth.getUser(token);
    } catch {
      // ignore cleanup failure
    }
  }

  return Response.json({ ok: true }, { headers });
}
