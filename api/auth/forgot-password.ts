import {
  createBackendSupabaseClient,
  getRequestBaseUrl,
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

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  try {
    const callbackUrl = `${getRequestBaseUrl(request)}/api/auth/callback`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: error.status || 400 });
    }

    return Response.json({
      ok: true,
      message: 'Password reset email sent. Check your inbox for the reset link.',
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to send password reset email.',
      },
      { status: 500 }
    );
  }
}
