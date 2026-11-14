import {
  SB_ACCESS_COOKIE,
  SB_REFRESH_COOKIE,
  appendAuthCookies,
  appendClearAuthCookies,
  createBackendSupabaseClient,
  getRequestBaseUrl,
  getSupabaseConfig,
  parseCookies,
  serializeSupabaseUser,
} from './_supabaseAuth.js';

function getAuthSubroute(request: Request): string {
  const reqUrl = new URL(request.url);
  const paramRoute = reqUrl.searchParams.get('__route');
  if (paramRoute !== null) {
    return paramRoute.replace(/^\/+|\/+$/g, '').toLowerCase();
  }
  return reqUrl.pathname
    .replace(/^\/api\/auth\/?/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

function handleConfig(request: Request): Response {
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

async function handleMe(request: Request): Promise<Response> {
  const supabase = createBackendSupabaseClient();
  if (!supabase) {
    return Response.json(
      { configured: false, authenticated: false, user: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = /^bearer\s+/i.test(authHeader)
    ? authHeader.replace(/^bearer\s+/i, '').trim()
    : '';
  const accessToken = bearerToken || cookies[SB_ACCESS_COOKIE] || '';
  const refreshToken =
    request.headers.get('x-refresh-token')?.trim() ||
    cookies[SB_REFRESH_COOKIE] ||
    '';

  if (!accessToken && !refreshToken) {
    return Response.json(
      { configured: true, authenticated: false, user: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) {
        return Response.json(
          {
            configured: true,
            authenticated: true,
            user: serializeSupabaseUser(data.user),
            accessToken,
            refreshToken: refreshToken || undefined,
          },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    if (refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (!error && data.session && data.user) {
        const headers = new Headers({ 'Cache-Control': 'no-store' });
        appendAuthCookies(
          headers,
          data.session.access_token,
          data.session.refresh_token
        );
        return Response.json(
          {
            configured: true,
            authenticated: true,
            user: serializeSupabaseUser(data.user),
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          },
          { headers }
        );
      }
    }

    const headers = new Headers({ 'Cache-Control': 'no-store' });
    appendClearAuthCookies(headers);
    return Response.json(
      { configured: true, authenticated: false, user: null },
      { headers }
    );
  } catch {
    return Response.json(
      { configured: true, authenticated: false, user: null },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

async function handleOAuthUrl(request: Request): Promise<Response> {
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

function handleCallback(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Craft — Signing In</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #ffffff;
        color: #0b0b0f;
        padding: 24px;
        text-align: center;
      }
      .card { max-width: 340px; }
      h1 { font-size: 18px; margin: 0 0 8px; font-weight: 700; }
      p { font-size: 14px; color: #52525b; margin: 0; line-height: 1.45; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 id="title">Completing sign-in…</h1>
      <p id="status">Returning you to AI Craft.</p>
    </div>
    <script>
      (async function () {
        var titleEl = document.getElementById('title');
        var statusEl = document.getElementById('status');
        try {
          var hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
          var queryParams = new URLSearchParams(window.location.search || '');
          var errMsg =
            hashParams.get('error_description') ||
            hashParams.get('error') ||
            queryParams.get('error_description') ||
            queryParams.get('error');

          if (errMsg) {
            titleEl.textContent = 'Sign-in could not complete';
            statusEl.textContent = errMsg;
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: errMsg }, '*');
              setTimeout(function () { window.close(); }, 1600);
            } else {
              setTimeout(function () {
                window.location.replace('/?auth_error=' + encodeURIComponent(errMsg));
              }, 700);
            }
            return;
          }

          var accessToken = hashParams.get('access_token') || '';
          var refreshToken = hashParams.get('refresh_token') || '';
          var flowType = hashParams.get('type') || queryParams.get('type') || '';

          if (flowType === 'recovery' && accessToken) {
            try {
              localStorage.setItem(
                'aicraft_sb_recovery_v1',
                JSON.stringify({ accessToken: accessToken, refreshToken: refreshToken })
              );
            } catch (e) {}
            if (window.opener) {
              window.opener.postMessage(
                { type: 'SUPABASE_AUTH_RECOVERY', accessToken: accessToken, refreshToken: refreshToken },
                '*'
              );
              window.close();
            } else {
              window.location.replace('/?auth_recovery=1');
            }
            return;
          }

          if (accessToken) {
            var res = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken
              })
            });
            var rawPayload = await res.text();
            var payload = {};
            try { payload = rawPayload ? JSON.parse(rawPayload) : {}; } catch (e) {}
            if (!res.ok || !payload.authenticated) {
              throw new Error(payload.error || 'Could not validate sign-in session.');
            }
            try {
              localStorage.setItem(
                'aicraft_sb_session_v1',
                JSON.stringify({
                  accessToken: payload.accessToken || accessToken,
                  refreshToken: payload.refreshToken || refreshToken
                })
              );
            } catch (e) {}

            if (window.opener) {
              window.opener.postMessage(
                {
                  type: 'OAUTH_AUTH_SUCCESS',
                  user: payload.user,
                  accessToken: payload.accessToken || accessToken,
                  refreshToken: payload.refreshToken || refreshToken
                },
                '*'
              );
              window.close();
            } else {
              window.location.replace('/');
            }
            return;
          }

          var noTokenMsg = 'Authorization code received. Please enable Implicit OAuth flow in Supabase or use Email sign-in.';
          titleEl.textContent = 'Authorization code received';
          statusEl.textContent = noTokenMsg;
          if (!window.opener) {
            setTimeout(function () {
              window.location.replace('/?auth_error=' + encodeURIComponent(noTokenMsg));
            }, 900);
          }
        } catch (err) {
          var msg = err && err.message ? err.message : 'Authentication failed.';
          titleEl.textContent = 'Sign-in error';
          statusEl.textContent = msg;
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', message: msg }, '*');
          } else {
            setTimeout(function () {
              window.location.replace('/?auth_error=' + encodeURIComponent(msg));
            }, 900);
          }
        }
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function handleSignup(request: Request): Promise<Response> {
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

async function handleLogin(request: Request): Promise<Response> {
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

async function handleForgotPassword(request: Request): Promise<Response> {
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

async function handleUpdatePassword(request: Request): Promise<Response> {
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

async function handleSession(request: Request): Promise<Response> {
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

async function handleLogout(request: Request): Promise<Response> {
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

export async function GET(request: Request): Promise<Response> {
  const route = getAuthSubroute(request);
  switch (route) {
    case 'config':
      return handleConfig(request);
    case 'me':
      return handleMe(request);
    case 'oauth/url':
      return handleOAuthUrl(request);
    case 'callback':
      return handleCallback();
    default:
      return Response.json({ error: 'Auth endpoint not found.' }, { status: 404 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const route = getAuthSubroute(request);
  switch (route) {
    case 'signup':
      return handleSignup(request);
    case 'login':
      return handleLogin(request);
    case 'forgot-password':
      return handleForgotPassword(request);
    case 'update-password':
      return handleUpdatePassword(request);
    case 'session':
      return handleSession(request);
    case 'logout':
      return handleLogout(request);
    default:
      return Response.json({ error: 'Auth endpoint not found.' }, { status: 404 });
  }
}
