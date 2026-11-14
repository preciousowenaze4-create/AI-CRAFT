import {
  appendAuthCookies,
  createBackendSupabaseClient,
  serializeSupabaseUser,
} from '../_supabaseAuth.js';

export async function POST(request: Request): Promise<Response> {
  const supabase = createBackendSupabaseClient();
  if (!supabase) {
    return Response.json(
      {
        error:
          'Supabase backend secrets (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured yet.',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    password?: string;
  };
  const accessToken =
    typeof body?.access_token === 'string' ? body.access_token.trim() : '';
  const refreshToken =
    typeof body?.refresh_token === 'string' ? body.refresh_token.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!accessToken || !refreshToken) {
    return Response.json(
      { error: 'Invalid or expired reset session.' },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return Response.json(
      { error: 'New password must be at least 6 characters long.' },
      { status: 400 }
    );
  }

  try {
    const { error: setErr } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setErr) {
      return Response.json({ error: setErr.message }, { status: 401 });
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error || !data.user) {
      return Response.json(
        { error: error?.message || 'Unable to update password.' },
        { status: error?.status || 400 }
      );
    }

    const headers = new Headers();
    appendAuthCookies(headers, accessToken, refreshToken);
    return Response.json(
      {
        ok: true,
        user: serializeSupabaseUser(data.user),
        accessToken,
        refreshToken,
      },
      { headers }
    );
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : 'Unable to update password.',
      },
      { status: 500 }
    );
  }
}
