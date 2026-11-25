export interface DispatchPayload {
  title: string;
  body: string;
  channels: Array<'In-App' | 'Email' | 'SMS' | 'WhatsApp'>;
  scope: string;
  targetValue: string;
  priority: 'Standard' | 'Priority' | 'Urgent';
  recipientsCount: number;
  consentVerified: boolean;
}

export interface DispatchGatewayReceipt {
  mode: 'live-gateway' | 'sandbox-fallback';
  provider: string;
  delivered: boolean;
  channelsAttempted: string[];
  message: string;
  timestamp: string;
}

export async function sendExternalDispatch(
  payload: DispatchPayload
): Promise<DispatchGatewayReceipt> {
  const externalChannels = payload.channels.filter((c) => c === 'SMS' || c === 'WhatsApp');
  if (externalChannels.length === 0) {
    return {
      mode: 'sandbox-fallback',
      provider: 'In-App Command Bus',
      delivered: true,
      channelsAttempted: payload.channels,
      message: 'Delivered to In-App Command Stream.',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Gateway HTTP ${res.status}`);
    }
    const data = (await res.json()) as DispatchGatewayReceipt;
    return data;
  } catch {
    return {
      mode: 'sandbox-fallback',
      provider: 'Local Device Relay (SMS / WhatsApp Links)',
      delivered: false,
      channelsAttempted: externalChannels,
      message:
        'Live SMS/WhatsApp server relay unavailable locally; announcement logged to Command Feed with quick WhatsApp/SMS links below.',
      timestamp: new Date().toISOString(),
    };
  }
}

export function buildWhatsAppRelayUrl(title: string, body: string): string {
  const text = `*${title}*\n\n${body}\n\n— YLDM Campaign Command`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildSmsRelayUrl(title: string, body: string): string {
  const text = `${title}: ${body}`;
  return `sms:?body=${encodeURIComponent(text)}`;
}
