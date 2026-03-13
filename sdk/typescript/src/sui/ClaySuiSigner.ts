import { SignatureWithBytes } from "@mysten/sui/cryptography";

import { ClaySandboxClient } from "../common/client";
import { bytesToHex, hexToBytes, toBase64 } from "../common/encoding";
import { ClayConfig } from "../common/types";

function toSerializedSuiSignature(rawSignatureHex: string, publicKeyHex?: string): string {
  if (!publicKeyHex) {
    throw new Error("Clay Sandbox did not return the Sui public key needed to serialize the signature");
  }

  const signature = hexToBytes(rawSignatureHex);
  const publicKey = hexToBytes(publicKeyHex);
  const serialized = new Uint8Array(1 + signature.length + publicKey.length);
  serialized[0] = 0x00; // Ed25519 scheme flag.
  serialized.set(signature, 1);
  serialized.set(publicKey, 1 + signature.length);
  return toBase64(serialized);
}

/**
 * Sui adapter for Clay.
 * Returns the official `SignatureWithBytes` shape expected by `@mysten/sui`.
 */
export class ClaySuiSigner {
  private readonly client: ClaySandboxClient;
  private readonly address: string;

  constructor(config: ClayConfig, address: string) {
    this.client = new ClaySandboxClient(config);
    this.address = address;
  }

  static async fromSandbox(config: ClayConfig): Promise<ClaySuiSigner> {
    const client = new ClaySandboxClient(config);
    const address = await client.getRequiredAddress("sui");
    return new ClaySuiSigner(config, address);
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async signTransactionBlock(bytes: Uint8Array): Promise<SignatureWithBytes> {
    const res = await this.client.sign({
      chain: "sui",
      sign_mode: "transaction",
      tx_payload_hex: bytesToHex(bytes),
    });

    return {
      bytes: toBase64(bytes),
      signature: toSerializedSuiSignature(res.signature_hex, res.from),
    };
  }

  async signPersonalMessage(bytes: Uint8Array): Promise<SignatureWithBytes> {
    const res = await this.client.sign({
      chain: "sui",
      sign_mode: "personal_sign",
      tx_payload_hex: bytesToHex(bytes),
    });

    return {
      bytes: toBase64(bytes),
      signature: toSerializedSuiSignature(res.signature_hex, res.from),
    };
  }
}
