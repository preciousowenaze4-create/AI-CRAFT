import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

export const SB_ACCESS_COOKIE = 'aicraft_sb_access';
export const SB_REFRESH_COOKIE = 'aicraft_sb_refresh';

export function cleanEnvKey(raw: string | undefined, placeholders: string[]): string {
  if (typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (/^bearer\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^bearer\s+/i, '').trim();
  }
  if (!cleaned || placeholders.includes(cleaned)) return '';
  return cleaned;
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const urlCandidates = [
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PROJECT_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
  ];
  const anonCandidates = [
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLIC_KEY,
    process.env.SUPABASE_KEY,
  ];
  const serviceCandidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ];

  let url = '';
  for (const raw of urlCandidates) {
    const cleaned = cleanEnvKey(raw, ['MY_SUPABASE_URL']);
    if (cleaned && /^https?:\/\//i.test(cleaned)) {
      try {
        url = new URL(cleaned).origin;
      } catch {
        url = cleaned
          .replace(/\/+(rest|auth|storage|realtime)\/v\d+.*$/i, '')
          .replace(/\/+$/, '');
      }
      break;
    }
  }

  let anonKey = '';
  for (const raw of anonCandidates) {
    const cleaned = cleanEnvKey(raw, ['MY_SUPABASE_ANON_KEY']);
    if (cleaned) {
      anonKey = cleaned;
      break;
    }
  }

  let serviceRoleKey = '';
  for (const raw of serviceCandidates) {
    const cleaned = cleanEnvKey(raw, ['MY_SUPABASE_SERVICE_ROLE_KEY']);
    if (cleaned) {
      serviceRoleKey = cleaned;
      break;
    }
  }

  return {
    url,
    anonKey: anonKey || serviceRoleKey,
    serviceRoleKey,
  };
}

export function createBackendSupabaseClient(useImplicitFlow = false) {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      ...(useImplicitFlow ? { flowType: 'implicit' as const } : {}),
    },
  });
}

export function getRequestBaseUrl(request: Request): string {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (!isVercel) {
    const envUrl = cleanEnvKey(process.env.APP_URL, ['MY_APP_URL']);
    if (envUrl) return envUrl.replace(/\/+$/, '');
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }

  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();
  if (hostHeader) {
    const proto = hostHeader.includes('localhost') ? 'http' : 'https';
    return `${proto}://${hostHeader}`.replace(/\/+$/, '');
  }

  try {
    return new URL(request.url).origin;
  } catch {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}`;
    }
    return 'http://localhost:3000';
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function appendAuthCookies(
  headers: Headers,
  accessToken: string,
  refreshToken?: string | null
) {
  headers.append(
    'Set-Cookie',
    `${SB_ACCESS_COOKIE}=${encodeURIComponent(
      accessToken
    )}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 7}`
  );
  if (refreshToken) {
    headers.append(
      'Set-Cookie',
      `${SB_REFRESH_COOKIE}=${encodeURIComponent(
        refreshToken
      )}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`
    );
  }
}

export function appendClearAuthCookies(headers: Headers) {
  headers.append(
    'Set-Cookie',
    `${SB_ACCESS_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
  );
  headers.append(
    'Set-Cookie',
    `${SB_REFRESH_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
  );
}

export function serializeSupabaseUser(user: SupabaseUser | null | undefined) {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const rawName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.user_name === 'string' && meta.user_name.trim()) ||
    (user.email ? user.email.split('@')[0] : 'AI Craft User');
  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) ||
    (typeof meta.picture === 'string' && meta.picture.trim()) ||
    null;

  return {
    id: user.id,
    email: user.email || '',
    name: rawName,
    avatarUrl,
    provider: typeof appMeta.provider === 'string' ? appMeta.provider : 'email',
  };
}
