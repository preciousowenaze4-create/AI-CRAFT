import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import { AuthUser } from '../types/craft';

export type AuthViewMode = 'welcome' | 'signin' | 'signup' | 'forgot' | 'recovery';

export interface StoredSupabaseSession {
  accessToken: string;
  refreshToken?: string;
}

export const STORAGE_SB_SESSION_KEY = 'aicraft_sb_session_v1';
export const STORAGE_SB_RECOVERY_KEY = 'aicraft_sb_recovery_v1';

async function safeParseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

interface AuthScreenProps {
  initialView?: AuthViewMode;
  recoveryTokens?: StoredSupabaseSession | null;
  onAuthenticated: (user: AuthUser, session: StoredSupabaseSession) => void;
}

const CODE_GLYPHS = [
  { text: '<>', top: '7%', left: '41%', color: 'rgba(13, 91, 255, 0.09)', size: '18px' },
  { text: '{}', top: '9%', left: '66%', color: 'rgba(11, 11, 15, 0.075)', size: '24px' },
  { text: '::', top: '4%', left: '70%', color: 'rgba(122, 104, 246, 0.10)', size: '16px' },
  { text: '</>', top: '21%', left: '57%', color: 'rgba(13, 91, 255, 0.085)', size: '15px' },
  { text: '10', top: '20%', left: '76%', color: 'rgba(11, 11, 15, 0.06)', size: '13px' },
  { text: '&&', top: '31%', left: '66%', color: 'rgba(13, 91, 255, 0.085)', size: '14px' },
  { text: '[]', top: '27%', left: '55%', color: 'rgba(11, 11, 15, 0.065)', size: '19px' },
  { text: '&&', top: '49%', left: '41%', color: 'rgba(13, 91, 255, 0.095)', size: '23px' },
  { text: '=>', top: '45%', left: '14%', color: 'rgba(122, 104, 246, 0.09)', size: '16px' },
  { text: '++', top: '52%', left: '90%', color: 'rgba(13, 91, 255, 0.09)', size: '19px' },
  { text: '||', top: '52%', left: '79%', color: 'rgba(11, 11, 15, 0.065)', size: '25px' },
  { text: '</>', top: '56%', left: '16%', color: 'rgba(13, 91, 255, 0.08)', size: '18px' },
  { text: '0x', top: '56%', left: '69%', color: 'rgba(11, 11, 15, 0.06)', size: '13px' },
  { text: '++', top: '57%', left: '74%', color: 'rgba(13, 91, 255, 0.085)', size: '17px' },
  { text: '//', top: '61%', left: '22%', color: 'rgba(122, 104, 246, 0.09)', size: '21px' },
  { text: '{}', top: '76%', left: '12%', color: 'rgba(11, 11, 15, 0.065)', size: '20px' },
  { text: '%%', top: '69%', left: '91%', color: 'rgba(122, 104, 246, 0.09)', size: '22px' },
  { text: '=>', top: '88%', left: '58%', color: 'rgba(13, 91, 255, 0.085)', size: '20px' },
  { text: '[]', top: '83%', left: '79%', color: 'rgba(11, 11, 15, 0.065)', size: '21px' },
  { text: '0x', top: '95%', left: '26%', color: 'rgba(11, 11, 15, 0.06)', size: '13px' },
];

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-[#0B0B0F]"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-[#0B0B0F]"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function AuthScreen({
  initialView = 'welcome',
  recoveryTokens = null,
  onAuthenticated,
}: AuthScreenProps) {
  const [view, setView] = useState<AuthViewMode>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    'google' | 'apple' | 'github' | 'email' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const popupPollRef = useRef<number | null>(null);
  const oauthUrlCacheRef = useRef<Partial<Record<'google' | 'apple' | 'github', string>>>({});

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const authError = params.get('auth_error');
      if (authError) {
        setErrorMessage(authError);
        params.delete('auth_error');
        const nextSearch = params.toString();
        window.history.replaceState(
          {},
          '',
          nextSearch ? `${window.location.pathname}?${nextSearch}` : window.location.pathname
        );
      }
    } catch {
      // ignore URL search read error
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const providers: Array<'google' | 'apple' | 'github'> = ['google', 'apple', 'github'];
    void Promise.all(
      providers.map(async (provider) => {
        try {
          const res = await fetch(`/api/auth/oauth/url?provider=${provider}`);
          if (!res.ok) return;
          const data = await safeParseJson<{ url?: string }>(res);
          if (!cancelled && data?.url) {
            oauthUrlCacheRef.current[provider] = data.url;
          }
        } catch {
          // ignore prefetch error; handleOAuthClick will fetch on demand
        }
      })
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const stopPopupPolling = () => {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || '';
      if (
        origin &&
        origin !== window.location.origin &&
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost')
      ) {
        return;
      }

      const data = event.data as
        | {
            type?: string;
            user?: AuthUser;
            accessToken?: string;
            refreshToken?: string;
            message?: string;
          }
        | undefined;

      if (!data?.type) return;

      if (data.type === 'OAUTH_AUTH_SUCCESS' && data.user && data.accessToken) {
        stopPopupPolling();
        setLoadingProvider(null);
        setErrorMessage(null);
        const session: StoredSupabaseSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
        try {
          window.localStorage.setItem(STORAGE_SB_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore storage failure
        }
        onAuthenticated(data.user, session);
      } else if (data.type === 'OAUTH_AUTH_ERROR') {
        stopPopupPolling();
        setLoadingProvider(null);
        setErrorMessage(data.message || 'Sign-in was canceled or failed.');
      } else if (data.type === 'SUPABASE_AUTH_RECOVERY' && data.accessToken) {
        stopPopupPolling();
        setLoadingProvider(null);
        setView('recovery');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopPopupPolling();
    };
  }, [onAuthenticated]);

  const switchView = (next: AuthViewMode) => {
    setErrorMessage(null);
    setInfoMessage(null);
    setShowPassword(false);
    setView(next);
  };

  const handleOAuthClick = async (provider: 'google' | 'apple' | 'github') => {
    if (loadingProvider) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setLoadingProvider(provider);

    const providerLabel =
      provider === 'google'
        ? 'Google'
        : provider === 'apple'
          ? 'Apple'
          : 'GitHub';

    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const cachedUrl = oauthUrlCacheRef.current[provider];

    // On direct mobile/Vercel/PWA visits (outside iframe), navigate top window directly
    // to avoid iOS/Android popup blockers and open native Google/Apple/GitHub login cleanly.
    if (!isInIframe) {
      try {
        let targetUrl = cachedUrl;
        if (!targetUrl) {
          const response = await fetch(
            `/api/auth/oauth/url?provider=${encodeURIComponent(provider)}`
          );
          const data = await safeParseJson<{ url?: string; error?: string }>(response);
          if (!response.ok || !data?.url) {
            setLoadingProvider(null);
            setErrorMessage(
              data?.error ||
                `Unable to start ${providerLabel} sign-in. Check your backend environment variables.`
            );
            return;
          }
          targetUrl = data.url;
          oauthUrlCacheRef.current[provider] = targetUrl;
        }
        window.location.assign(targetUrl);
        return;
      } catch (err) {
        setLoadingProvider(null);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Network error while connecting to Supabase authentication.'
        );
        return;
      }
    }

    // Inside preview iframe: open popup synchronously on user gesture
    const popup = window.open(
      cachedUrl || 'about:blank',
      'aicraft_oauth_popup',
      'width=520,height=680'
    );

    if (!popup) {
      setLoadingProvider(null);
      setErrorMessage('Please allow popups for this site to continue with sign-in.');
      return;
    }

    try {
      if (!cachedUrl) {
        const response = await fetch(
          `/api/auth/oauth/url?provider=${encodeURIComponent(provider)}`
        );
        const data = await safeParseJson<{ url?: string; error?: string }>(response);

        if (!response.ok || !data?.url) {
          popup.close();
          setLoadingProvider(null);
          setErrorMessage(
            data?.error ||
              `Unable to start ${providerLabel} sign-in. Check your backend environment variables.`
          );
          return;
        }

        oauthUrlCacheRef.current[provider] = data.url;
        popup.location.href = data.url;
      }

      stopPopupPolling();
      popupPollRef.current = window.setInterval(() => {
        try {
          const raw = window.localStorage.getItem(STORAGE_SB_SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as StoredSupabaseSession;
            if (parsed?.accessToken) {
              stopPopupPolling();
              void (async () => {
                try {
                  const meRes = await fetch('/api/auth/me', {
                    headers: {
                      Authorization: `Bearer ${parsed.accessToken}`,
                      ...(parsed.refreshToken
                        ? { 'x-refresh-token': parsed.refreshToken }
                        : {}),
                    },
                  });
                  const meData = await safeParseJson<{
                    authenticated?: boolean;
                    user?: AuthUser | null;
                    accessToken?: string;
                    refreshToken?: string;
                  }>(meRes);
                  if (meData?.authenticated && meData.user) {
                    setLoadingProvider(null);
                    onAuthenticated(meData.user, {
                      accessToken: meData.accessToken || parsed.accessToken,
                      refreshToken: meData.refreshToken || parsed.refreshToken,
                    });
                    return;
                  }
                } catch {
                  // wait for next tick or postMessage
                }
              })();
              return;
            }
          }
        } catch {
          // ignore localStorage read errors
        }

        if (popup.closed) {
          stopPopupPolling();
          setLoadingProvider((current) => (current === provider ? null : current));
        }
      }, 650);
    } catch (err) {
      popup.close();
      setLoadingProvider(null);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Network error while connecting to Supabase authentication.'
      );
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoadingProvider('email');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await safeParseJson<{
        authenticated?: boolean;
        user?: AuthUser;
        accessToken?: string;
        refreshToken?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data?.authenticated || !data.user || !data.accessToken) {
        setErrorMessage(data?.error || 'Invalid email or password.');
        return;
      }

      const session: StoredSupabaseSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      try {
        window.localStorage.setItem(STORAGE_SB_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore storage failure
      }
      onAuthenticated(data.user, session);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in right now.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoadingProvider('email');
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await safeParseJson<{
        authenticated?: boolean;
        needsEmailConfirmation?: boolean;
        user?: AuthUser;
        accessToken?: string;
        refreshToken?: string;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data) {
        setErrorMessage(data?.error || 'Could not create your account.');
        return;
      }

      if (data.authenticated && data.user && data.accessToken) {
        const session: StoredSupabaseSession = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
        try {
          window.localStorage.setItem(STORAGE_SB_SESSION_KEY, JSON.stringify(session));
        } catch {
          // ignore storage failure
        }
        onAuthenticated(data.user, session);
        return;
      }

      setInfoMessage(
        data.message || 'Check your email to confirm your account, then sign in.'
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to create account right now.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setLoadingProvider('email');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await safeParseJson<{
        ok?: boolean;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data) {
        setErrorMessage(data?.error || 'Could not send reset email.');
        return;
      }

      setInfoMessage(
        data.message || 'Password reset email sent. Check your inbox for the reset link.'
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send password reset email.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadingProvider) return;
    setErrorMessage(null);
    setInfoMessage(null);

    let tokens = recoveryTokens;
    if (!tokens) {
      try {
        const raw = window.localStorage.getItem(STORAGE_SB_RECOVERY_KEY);
        if (raw) tokens = JSON.parse(raw) as StoredSupabaseSession;
      } catch {
        tokens = null;
      }
    }

    if (!tokens?.accessToken || !tokens?.refreshToken) {
      setErrorMessage('Reset link expired. Please request a new password reset.');
      return;
    }
    if (confirmPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setLoadingProvider('email');
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          password: confirmPassword,
        }),
      });
      const data = await safeParseJson<{
        ok?: boolean;
        user?: AuthUser;
        accessToken?: string;
        refreshToken?: string;
        error?: string;
      }>(response);

      if (!response.ok || !data?.user || !data.accessToken) {
        setErrorMessage(data?.error || 'Failed to update password.');
        return;
      }

      const session: StoredSupabaseSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      try {
        window.localStorage.removeItem(STORAGE_SB_RECOVERY_KEY);
        window.localStorage.setItem(STORAGE_SB_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore storage error
      }
      onAuthenticated(data.user, session);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update password.'
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 h-dvh w-full bg-white overflow-hidden overscroll-none select-none sm:select-auto flex flex-col">
      {/* Subtle scattered code symbol layer on pure white background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {CODE_GLYPHS.map((glyph, idx) => (
          <span
            key={idx}
            className="absolute font-mono font-bold tracking-tight select-none"
            style={{
              top: glyph.top,
              left: glyph.left,
              color: glyph.color,
              fontSize: glyph.size,
              lineHeight: 1,
            }}
          >
            {glyph.text}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[420px] mx-auto px-6 pt-safe pb-safe flex flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'welcome' && (
            <motion.div
              key="auth-welcome"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 flex flex-col justify-between pb-0 pt-10"
            >
              {/* Centered App Logo & Title */}
              <div className="flex-1 flex flex-col items-center justify-center pb-4">
                <img
                  src="/logo-mark.png"
                  alt="AI Craft logo"
                  className="w-[74px] h-[74px] object-contain mb-5 select-none"
                />
                <h1 className="font-display font-bold text-[27px] tracking-[-0.025em] text-[#0B0B0F] text-center leading-tight">
                  Welcome to AI Craft
                </h1>
              </div>

              {/* Action Stack: Round Social Row (Google, Apple, GitHub), OR, Email */}
              <div className="shrink-0 w-full flex flex-col gap-3 translate-y-1">
                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] font-medium text-red-700 text-center"
                  >
                    {errorMessage}
                  </p>
                )}

                <div className="flex items-center justify-center gap-6 py-1">
                  <button
                    type="button"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleOAuthClick('google')}
                    aria-label="Continue with Google"
                    title="Continue with Google"
                    className="w-[64px] h-[64px] rounded-full bg-[#F5F5F7] hover:bg-[#ECECEF] active:scale-[0.95] border border-black/[0.08] shadow-[0_2px_10px_rgba(15,15,30,0.04)] flex items-center justify-center transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF]"
                  >
                    {loadingProvider === 'google' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#0D5BFF]" />
                    ) : (
                      <GoogleIcon />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleOAuthClick('apple')}
                    aria-label="Continue with Apple"
                    title="Continue with Apple"
                    className="w-[64px] h-[64px] rounded-full bg-[#F5F5F7] hover:bg-[#ECECEF] active:scale-[0.95] border border-black/[0.08] shadow-[0_2px_10px_rgba(15,15,30,0.04)] flex items-center justify-center transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF]"
                  >
                    {loadingProvider === 'apple' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#0B0B0F]" />
                    ) : (
                      <AppleIcon />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleOAuthClick('github')}
                    aria-label="Continue with GitHub"
                    title="Continue with GitHub"
                    className="w-[64px] h-[64px] rounded-full bg-[#F5F5F7] hover:bg-[#ECECEF] active:scale-[0.95] border border-black/[0.08] shadow-[0_2px_10px_rgba(15,15,30,0.04)] flex items-center justify-center transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF]"
                  >
                    {loadingProvider === 'github' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#0B0B0F]" />
                    ) : (
                      <GitHubIcon />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3.5 my-0.5">
                  <div className="h-px flex-1 bg-black/[0.08]" />
                  <span className="text-[12px] font-semibold tracking-wider text-[#71717A] uppercase">
                    OR
                  </span>
                  <div className="h-px flex-1 bg-black/[0.08]" />
                </div>

                <button
                  type="button"
                  disabled={loadingProvider !== null}
                  onClick={() => switchView('signin')}
                  className="w-full h-[54px] rounded-[14px] bg-[#F5F5F7] hover:bg-[#ECECEF] active:scale-[0.99] border border-black/[0.08] px-4 flex items-center justify-center gap-3 text-[15.5px] font-semibold text-[#0B0B0F] transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D5BFF]"
                >
                  <Mail className="w-[19px] h-[19px] text-[#0B0B0F]" strokeWidth={2.1} />
                  <span>Continue with Email</span>
                </button>
              </div>
            </motion.div>
          )}

          {view === 'signin' && (
            <motion.div
              key="auth-signin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 flex flex-col pt-4 pb-6"
            >
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/logo-mark.png"
                  alt="AI Craft logo"
                  className="w-10 h-10 object-contain mb-3"
                />
                <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-[#0B0B0F] text-center">
                  Sign in with Email
                </h1>
              </div>

              <form onSubmit={handleSignInSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white px-4 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white pl-4 pr-12 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[42px] min-h-[42px] flex items-center justify-center text-[#71717A] hover:text-[#0B0B0F]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-[19px] h-[19px]" />
                      ) : (
                        <Eye className="w-[19px] h-[19px]" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end mt-2.5">
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-[13.5px] font-semibold text-[#0D5BFF] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] font-medium text-red-700 text-center"
                  >
                    {errorMessage}
                  </p>
                )}

                {infoMessage && (
                  <p
                    role="status"
                    className="rounded-xl bg-[#EEF4FF] border border-[#0D5BFF]/20 px-3.5 py-2.5 text-[13px] font-medium text-[#0D5BFF] text-center"
                  >
                    {infoMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className="mt-1 w-full h-[52px] rounded-[13px] bg-[#0D5BFF] hover:bg-[#094EE0] active:scale-[0.99] text-white font-semibold text-[16px] shadow-[0_8px_22px_rgba(13,91,255,0.22)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loadingProvider === 'email' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Sign In</span>
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-[14.5px] text-[#52525B]">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('signup')}
                    className="font-semibold text-[#0D5BFF] hover:underline"
                  >
                    Sign Up
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => switchView('welcome')}
                  className="text-[14.5px] font-semibold text-[#0D5BFF] hover:underline"
                >
                  Back to Sign In Options
                </button>
              </div>
            </motion.div>
          )}

          {view === 'signup' && (
            <motion.div
              key="auth-signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 flex flex-col pt-4 pb-6"
            >
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/logo-mark.png"
                  alt="AI Craft logo"
                  className="w-10 h-10 object-contain mb-3"
                />
                <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-[#0B0B0F] text-center">
                  Create Account
                </h1>
                <p className="text-[14.5px] text-[#71717A] mt-1 text-center">
                  Sign up to get started
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white px-4 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white pl-4 pr-12 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[42px] min-h-[42px] flex items-center justify-center text-[#71717A] hover:text-[#0B0B0F]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-[19px] h-[19px]" />
                      ) : (
                        <Eye className="w-[19px] h-[19px]" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] font-medium text-red-700 text-center"
                  >
                    {errorMessage}
                  </p>
                )}

                {infoMessage && (
                  <p
                    role="status"
                    className="rounded-xl bg-[#EEF4FF] border border-[#0D5BFF]/20 px-3.5 py-2.5 text-[13px] font-medium text-[#0D5BFF] text-center"
                  >
                    {infoMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className="mt-2 w-full h-[52px] rounded-[13px] bg-[#0D5BFF] hover:bg-[#094EE0] active:scale-[0.99] text-white font-semibold text-[16px] shadow-[0_8px_22px_rgba(13,91,255,0.22)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loadingProvider === 'email' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Sign Up</span>
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-[14.5px] text-[#52525B]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('signin')}
                    className="font-semibold text-[#0D5BFF] hover:underline"
                  >
                    Sign In
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => switchView('welcome')}
                  className="text-[14.5px] font-semibold text-[#0D5BFF] hover:underline"
                >
                  Back to Sign In Options
                </button>
              </div>
            </motion.div>
          )}

          {view === 'forgot' && (
            <motion.div
              key="auth-forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 flex flex-col pt-4 pb-6"
            >
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/logo-mark.png"
                  alt="AI Craft logo"
                  className="w-10 h-10 object-contain mb-3"
                />
                <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-[#0B0B0F] text-center">
                  Forgot Password
                </h1>
                <p className="text-[14.5px] text-[#71717A] mt-1 text-center">
                  Enter your email to get a reset link
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white px-4 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                  />
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] font-medium text-red-700 text-center"
                  >
                    {errorMessage}
                  </p>
                )}

                {infoMessage && (
                  <p
                    role="status"
                    className="rounded-xl bg-[#EEF4FF] border border-[#0D5BFF]/20 px-3.5 py-2.5 text-[13px] font-medium text-[#0D5BFF] text-center"
                  >
                    {infoMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className="mt-1 w-full h-[52px] rounded-[13px] bg-[#0D5BFF] hover:bg-[#094EE0] active:scale-[0.99] text-white font-semibold text-[16px] shadow-[0_8px_22px_rgba(13,91,255,0.22)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loadingProvider === 'email' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Send Reset Link</span>
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="text-[14.5px] font-semibold text-[#0D5BFF] hover:underline"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchView('welcome')}
                  className="text-[14px] font-medium text-[#71717A] hover:text-[#0B0B0F]"
                >
                  Back to Sign In Options
                </button>
              </div>
            </motion.div>
          )}

          {view === 'recovery' && (
            <motion.div
              key="auth-recovery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 flex flex-col pt-4 pb-6"
            >
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/logo-mark.png"
                  alt="AI Craft logo"
                  className="w-10 h-10 object-contain mb-3"
                />
                <h1 className="font-display font-bold text-[24px] tracking-[-0.02em] text-[#0B0B0F] text-center">
                  Set New Password
                </h1>
                <p className="text-[14.5px] text-[#71717A] mt-1 text-center">
                  Choose a new password for your AI Craft account
                </p>
              </div>

              <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="recovery-password"
                    className="block text-[13.5px] font-semibold text-[#0B0B0F] mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="recovery-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full h-[52px] rounded-[13px] bg-[#F5F5F7] border border-black/[0.08] focus:border-[#0D5BFF] focus:bg-white pl-4 pr-12 text-[15px] text-[#0B0B0F] placeholder:text-[#9CA3AF] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[42px] min-h-[42px] flex items-center justify-center text-[#71717A] hover:text-[#0B0B0F]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-[19px] h-[19px]" />
                      ) : (
                        <Eye className="w-[19px] h-[19px]" />
                      )}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p
                    role="alert"
                    className="rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] font-medium text-red-700 text-center"
                  >
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingProvider !== null}
                  className="mt-1 w-full h-[52px] rounded-[13px] bg-[#0D5BFF] hover:bg-[#094EE0] active:scale-[0.99] text-white font-semibold text-[16px] shadow-[0_8px_22px_rgba(13,91,255,0.22)] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loadingProvider === 'email' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Update Password</span>
                </button>
              </form>

              <div className="mt-6 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => switchView('welcome')}
                  className="text-[14.5px] font-semibold text-[#0D5BFF] hover:underline"
                >
                  Back to Sign In Options
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
