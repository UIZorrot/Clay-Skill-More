import {
  AbstractSigner,
  Provider,
  resolveAddress,
  resolveProperties,
  Signature,
  toUtf8Bytes,
  Transaction,
  TransactionRequest,
  TypedDataDomain,
  TypedDataField,
  hexlify,
} from "ethers";

import { ClaySandboxClient } from "../common/client";
import { ClayConfig } from "../common/types";

function inferPrimaryType(types: Record<string, Array<TypedDataField>>): string | undefined {
  const candidates = Object.keys(types).filter((name) => name !== "EIP712Domain");
  if (candidates.length <= 1) {
    return candidates[0];
  }

  const referenced = new Set<string>();
  for (const fields of Object.values(types)) {
    for (const field of fields) {
      referenced.add(field.type.replace(/\[\]$/, ""));
    }
  }

  return candidates.find((name) => !referenced.has(name)) ?? candidates[0];
}

export class ClayEthersSigner extends AbstractSigner {
  private readonly client: ClaySandboxClient;
  private readonly config: ClayConfig;
  private address: string;

  constructor(config: ClayConfig, provider: Provider | null = null, address = "") {
    super(provider);
    this.client = new ClaySandboxClient(config);
    this.config = config;
    this.address = address;
  }

  async getAddress(): Promise<string> {
    if (this.address) {
      return this.address;
    }

    const status = await this.client.getStatus();
    this.address = status.addresses?.ethereum ?? status.address ?? "";
    if (!this.address) {
      throw new Error("Clay Sandbox status did not include an ethereum address");
    }
    return this.address;
  }

  connect(provider: Provider | null): ClayEthersSigner {
    return new ClayEthersSigner(this.config, provider, this.address);
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const payloadHex = typeof message === "string" ? hexlify(toUtf8Bytes(message)) : hexlify(message);
    const res = await this.client.sign({
      chain: "ethereum",
      sign_mode: "personal_sign",
      tx_payload_hex: payloadHex,
    });
    return res.signature_hex;
  }

  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, unknown>,
  ): Promise<string> {
    const primaryType = inferPrimaryType(types);
    if (!primaryType) {
      throw new Error("Typed data types must include a primary type");
    }

    const res = await this.client.sign({
      chain: "ethereum",
      sign_mode: "typed_data",
      typed_data: {
        domain,
        types,
        primaryType,
        message: value,
      },
    });
    return res.signature_hex;
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const tx = await resolveProperties(transaction);
    const normalizedTo = tx.to ? await resolveAddress(tx.to, this.provider) : null;
    const normalizedFrom = tx.from ? await resolveAddress(tx.from, this.provider) : undefined;
    const unsigned = Transaction.from({
      ...tx,
      to: normalizedTo,
      from: normalizedFrom,
    } as any);

    const res = await this.client.sign({
      chain: "ethereum",
      sign_mode: "transaction",
      to: normalizedTo ?? undefined,
      amount_wei: tx.value ? tx.value.toString() : "0",
      data: tx.data ? hexlify(tx.data) : "0x",
      tx_payload_hex: unsigned.unsignedSerialized,
    });

    unsigned.signature = Signature.from(res.signature_hex);
    return unsigned.serialized;
  }
}
