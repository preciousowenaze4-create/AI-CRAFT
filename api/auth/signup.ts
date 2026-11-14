import {
  appendAuthCookies,
  createBackendSupabaseClient,
  getRequestBaseUrl,
  serializeSupabaseUser,
} from '../_supabaseAuth.js';

export async function POST(request: Request): Promise<Response> {
  const supabase = createBackendSupabaseClient(true);
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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return Response.json(
      { error: 'Password must be at least 6 characters long.' },
      { status: 400 }
    );
  }

  try {
    const callbackUrl = `${getRequestBaseUrl(request)}/api/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      if (/already registered|already exists|duplicate/i.test(error.message)) {
        return Response.json(
          {
            error:
              'This email already has an account (from Google, GitHub, Apple, or Email). Please sign in instead.',
          },
          { status: 409 }
        );
      }
      return Response.json({ error: error.message }, { status: error.status || 400 });
    }

    if (
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      return Response.json(
        {
          error:
            'This email already has an account (from Google, GitHub, Apple, or Email). Please sign in instead.',
        },
        { status: 409 }
      );
    }

    if (data.session?.access_token) {
      const headers = new Headers();
      appendAuthCookies(
        headers,
        data.session.access_token,
        data.session.refresh_token
      );
      return Response.json(
        {
          authenticated: true,
          needsEmailConfirmation: false,
          user: serializeSupabaseUser(data.user),
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        },
        { headers }
      );
    }

    return Response.json({
      authenticated: false,
      needsEmailConfirmation: true,
      user: serializeSupabaseUser(data.user),
      message: 'Check your email to confirm your account, then sign in.',
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to create account with Supabase.',
      },
      { status: 500 }
    );
  }
}
