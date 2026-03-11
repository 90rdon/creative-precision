/**
 * NullclawGatewayClient — lightweight HTTP client for nullclaw/openclaw gateways
 */

export class NullclawGatewayClient {
  constructor(private endpoint: string, private token: string) {}

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  async healthCheck(): Promise<{ status: string; agents?: string[]; uptime?: number }> {
    try {
      const res = await fetch(`${this.endpoint}/health`, {
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return { status: 'degraded' };
      return res.json() as any;
    } catch {
      return { status: 'offline' };
    }
  }

  async sendMessage(opts: {
    message: string;
    sessionId: string;
    requestId: string;
    agentId?: string;
  }): Promise<{ response: string; sessionId: string }> {
    const res = await fetch(`${this.endpoint}/webhook`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        message: opts.message,
        session_id: opts.sessionId,
        request_id: opts.requestId,
        agent: opts.agentId,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      throw new Error(`Gateway ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as any;
    if (data.error) throw new Error(data.error);
    return { response: data.response, sessionId: opts.sessionId };
  }
}
