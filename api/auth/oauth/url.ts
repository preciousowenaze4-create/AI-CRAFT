import {
  createBackendSupabaseClient,
  getRequestBaseUrl,
} from '../../_supabaseAuth.js';

export async function GET(request: Request): Promise<Response> {
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

  const reqUrl = new URL(request.url);
  const providerParam = (reqUrl.searchParams.get('provider') || '').toLowerCase();
  if (
    providerParam !== 'google' &&
    providerParam !== 'apple' &&
    providerParam !== 'github'
  ) {
    return Response.json(
      { error: 'Unsupported OAuth provider.' },
      { status: 400 }
    );
  }

  try {
    const callbackUrl = `${getRequestBaseUrl(request)}/api/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: providerParam,
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: true,
        ...(providerParam === 'google'
          ? {
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
              },
            }
          : {}),
      },
    });

    if (error || !data?.url) {
      return Response.json(
        {
          error:
            error?.message || `Failed to create ${providerParam} login URL.`,
        },
        { status: 400 }
      );
    }

    return Response.json(
      { url: data.url, callbackUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to initialize OAuth sign in.',
      },
      { status: 500 }
    );
  }
}
