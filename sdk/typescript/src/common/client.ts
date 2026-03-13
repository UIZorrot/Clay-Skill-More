import { ClayConfig, ClaySignRequest, ClaySignResponse, ClayStatusResponse } from "./types";

export class ClaySandboxClient {
  private config: ClayConfig;

  constructor(config: ClayConfig) {
    this.config = config;
    this.config.sandboxUrl = this.config.sandboxUrl.replace(/\/+$/, "");
  }

  async sign(request: Omit<ClaySignRequest, "uid">): Promise<ClaySignResponse> {
    const fullRequest: ClaySignRequest = {
      ...request,
      uid: this.config.uid,
    };

    const response = await fetch(`${this.config.sandboxUrl}/api/v1/tx/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.sandboxToken}`,
      },
      body: JSON.stringify(fullRequest),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Clay Sandbox Error (${response.status}): ${errorText}`);
    }

    return (await response.json()) as ClaySignResponse;
  }

  async getStatus(): Promise<ClayStatusResponse> {
    const response = await fetch(`${this.config.sandboxUrl}/api/v1/wallet/status`, {
      headers: {
        Authorization: `Bearer ${this.config.sandboxToken}`,
      },
    });
    if (!response.ok) throw new Error(`Failed to get status: ${response.status}`);
    return (await response.json()) as ClayStatusResponse;
  }

  async getRequiredAddress(chain: string): Promise<string> {
    const status = await this.getStatus();
    const address = status.addresses?.[chain] ?? (chain === "ethereum" ? status.address : undefined);
    if (!address) {
      throw new Error(`Clay Sandbox status did not include a ${chain} address`);
    }
    return address;
  }
}
