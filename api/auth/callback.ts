export async function GET(): Promise<Response> {
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
