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
    email?: string;
    password?: string;
  };
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return Response.json(
      { error: 'Please enter both your email and password.' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return Response.json(
        { error: error?.message || 'Invalid email or password.' },
        { status: error?.status || 401 }
      );
    }

    const headers = new Headers();
    appendAuthCookies(
      headers,
      data.session.access_token,
      data.session.refresh_token
    );
    return Response.json(
      {
        authenticated: true,
        user: serializeSupabaseUser(data.user),
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
      { headers }
    );
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to sign in with Supabase right now.',
      },
      { status: 500 }
    );
  }
}
