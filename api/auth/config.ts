import { getRequestBaseUrl, getSupabaseConfig } from '../_supabaseAuth.js';

export async function GET(request: Request): Promise<Response> {
  const sbConfig = getSupabaseConfig();
  const callbackUrl = `${getRequestBaseUrl(request)}/api/auth/callback`;

  return Response.json(
    {
      supabaseConfigured: Boolean(sbConfig.url && sbConfig.anonKey),
      callbackUrl,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
