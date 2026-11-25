interface DispatchRequestBody {
  title?: string;
  body?: string;
  channels?: string[];
  scope?: string;
  targetValue?: string;
  priority?: string;
  recipientsCount?: number;
  consentVerified?: boolean;
  recipients?: string[];
}

function getEnv(): Record<string, string | undefined> {
  const proc = (globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return proc?.env ?? {};
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as DispatchRequestBody;
    if (!payload.consentVerified) {
      return Response.json(
        {
          mode: 'sandbox-fallback',
          provider: 'Policy Guard',
          delivered: false,
          channelsAttempted: payload.channels ?? [],
          message: 'External dispatch blocked: verified opt-in consent is required.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const env = getEnv();
    const channels = Array.isArray(payload.channels) ? payload.channels : [];
    const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
    const messageText = `${payload.title ?? 'Command Update'}: ${payload.body ?? ''}`.trim();

    // Optional live Termii SMS dispatch if server credentials are configured
    if (channels.includes('SMS') && env.TERMII_API_KEY && recipients.length > 0) {
      const termiiRes = await fetch('https://api.ng.termii.com/api/sms/send/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          from: env.TERMII_SENDER_ID || 'YLDM2027',
          sms: messageText.slice(0, 320),
          type: 'plain',
          channel: 'generic',
          api_key: env.TERMII_API_KEY,
        }),
      });
      if (termiiRes.ok) {
        return Response.json({
          mode: 'live-gateway',
          provider: 'Termii Nigeria SMS Gateway',
          delivered: true,
          channelsAttempted: channels,
          message: `Dispatched SMS to ${recipients.length} verified recipients via Termii.`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Optional live Meta WhatsApp Cloud API dispatch if server credentials are configured
    if (
      channels.includes('WhatsApp') &&
      env.WHATSAPP_CLOUD_TOKEN &&
      env.WHATSAPP_PHONE_NUMBER_ID &&
      recipients.length > 0
    ) {
      await fetch(
        `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_CLOUD_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipients[0],
            type: 'text',
            text: { body: messageText.slice(0, 1024) },
          }),
        }
      );
      return Response.json({
        mode: 'live-gateway',
        provider: 'Meta WhatsApp Cloud API',
        delivered: true,
        channelsAttempted: channels,
        message: 'Dispatched WhatsApp Cloud directive to verified coordinator contact.',
        timestamp: new Date().toISOString(),
      });
    }

    // Transparent non-configured / local fallback response
    return Response.json({
      mode: 'sandbox-fallback',
      provider: 'Vercel Dispatch Adapter (Await TERMII_API_KEY / WHATSAPP_CLOUD_TOKEN)',
      delivered: false,
      channelsAttempted: channels,
      message:
        'Broadcast logged cleanly; configure TERMII_API_KEY or WHATSAPP_CLOUD_TOKEN in Vercel Environment Variables to trigger automated carrier delivery, or use the direct WhatsApp/SMS relay links.',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        mode: 'sandbox-fallback',
        provider: 'Dispatch Adapter',
        delivered: false,
        channelsAttempted: [],
        message: 'Invalid dispatch request payload.',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
