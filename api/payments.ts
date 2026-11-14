import {
  buildPaymentCallbackHtml,
  getPaymentSecretKey,
  initializeCheckoutSession,
  listCustomerTransactions,
  verifyCheckoutTransaction,
} from './_paystack.js';
import { getRequestBaseUrl } from './_supabaseAuth.js';

function getPaymentSubroute(request: Request): string {
  const reqUrl = new URL(request.url);
  const paramRoute = reqUrl.searchParams.get('__route');
  if (paramRoute !== null) {
    return paramRoute.replace(/^\/+|\/+$/g, '').toLowerCase();
  }
  return reqUrl.pathname
    .replace(/^\/api\/payments\/?/i, '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

export async function GET(request: Request): Promise<Response> {
  const route = getPaymentSubroute(request);

  if (route === 'config') {
    return Response.json(
      { configured: Boolean(getPaymentSecretKey()) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (route === 'callback') {
    return new Response(buildPaymentCallbackHtml(), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (route === 'transactions') {
    const reqUrl = new URL(request.url);
    const email = reqUrl.searchParams.get('email') || '';
    const data = await listCustomerTransactions(email);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  }

  return Response.json({ error: 'Payment endpoint not found.' }, { status: 404 });
}

export async function POST(request: Request): Promise<Response> {
  const route = getPaymentSubroute(request);

  if (route === 'initialize') {
    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
      email?: string;
      userId?: string;
    };
    const callbackUrl = `${getRequestBaseUrl(request)}/api/payments/callback`;
    const result = await initializeCheckoutSession({
      planId: typeof body.planId === 'string' ? body.planId : '',
      email: typeof body.email === 'string' ? body.email : '',
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      callbackUrl,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(
      {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (route === 'verify') {
    const body = (await request.json().catch(() => ({}))) as {
      reference?: string;
    };
    const reference =
      typeof body.reference === 'string' ? body.reference.trim() : '';
    const result = await verifyCheckoutTransaction(reference);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json(
      {
        verified: result.verified,
        transaction: result.transaction,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return Response.json({ error: 'Payment endpoint not found.' }, { status: 404 });
}
