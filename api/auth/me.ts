import {
  SB_ACCESS_COOKIE,
  SB_REFRESH_COOKIE,
  appendAuthCookies,
  appendClearAuthCookies,
  createBackendSupabaseClient,
  parseCookies,
  serializeSupabaseUser,
} from '../_supabaseAuth.js';

export async function GET(request: Request): Promise<Response> {
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
