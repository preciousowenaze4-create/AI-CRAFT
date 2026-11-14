import {
  appendAuthCookies,
  createBackendSupabaseClient,
  serializeSupabaseUser,
} from '../_supabaseAuth.js';

export async function POST(request: Request): Promise<Response> {
  const supabase = createBackendSupabaseClient();
  if (!supabase) {
    return Response.json(
      { error: 'Supabase backend secrets are not configured yet.' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
  };
  const accessToken =
    typeof body?.access_token === 'string' ? body.access_token.trim() : '';
  const refreshToken =
    typeof body?.refresh_token === 'string' ? body.refresh_token.trim() : '';

  if (!accessToken) {
    return Response.json(
      { error: 'Missing Supabase access token.' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return Response.json(
        { error: error?.message || 'Invalid Supabase session token.' },
        { status: 401 }
      );
    }

    const headers = new Headers();
    appendAuthCookies(headers, accessToken, refreshToken || null);
    return Response.json(
      {
        authenticated: true,
        user: serializeSupabaseUser(data.user),
        accessToken,
        refreshToken: refreshToken || undefined,
      },
      { headers }
    );
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Failed to verify session.',
      },
      { status: 500 }
    );
  }
}
