import {
  Address,
  Hex,
  TransactionSerializable,
  isHex,
  serializeTransaction,
  toHex,
} from "viem";
import { LocalAccount, toAccount } from "viem/accounts";

import { ClaySandboxClient } from "../common/client";
import { ClayConfig } from "../common/types";

type ViemMessage = string | Uint8Array | { raw: string | Uint8Array };

function toMessageHex(message: ViemMessage): Hex {
  if (typeof message === "string") {
    return (isHex(message) ? message : toHex(message)) as Hex;
  }

  if (message instanceof Uint8Array) {
    return toHex(message) as Hex;
  }

  const raw = message.raw;
  return (typeof raw === "string" ? (isHex(raw) ? raw : toHex(raw)) : toHex(raw)) as Hex;
}

/**
 * Creates a standard viem LocalAccount that delegates signing to the Clay Sandbox.
 */
export function createClayAccount(config: ClayConfig, address: Address): LocalAccount {
  const client = new ClaySandboxClient(config);

  return toAccount({
    address,
    async sign({ hash }: { hash: Hex }) {
      const res = await client.sign({
        chain: "ethereum",
        sign_mode: "raw_hash",
        tx_payload_hex: hash,
      });
      return res.signature_hex as Hex;
    },
    async signMessage({ message }: { message: ViemMessage }) {
      const res = await client.sign({
        chain: "ethereum",
        sign_mode: "personal_sign",
        tx_payload_hex: toMessageHex(message),
      });
      return res.signature_hex as Hex;
    },
    async signTransaction(transaction: TransactionSerializable) {
      const unsignedTx = serializeTransaction(transaction);
      const res = await client.sign({
        chain: "ethereum",
        sign_mode: "transaction",
        tx_payload_hex: unsignedTx,
        to: transaction.to ?? undefined,
        amount_wei: transaction.value ? transaction.value.toString() : "0",
        data: transaction.data ?? "0x",
      });

      const signature = res.signature_hex;
      const r = `0x${signature.slice(2, 66)}` as Hex;
      const s = `0x${signature.slice(66, 130)}` as Hex;
      const yParity = Number.parseInt(signature.slice(130, 132), 16) as 0 | 1;

      return serializeTransaction(transaction, { r, s, yParity });
    },
    async signTypedData(typedData: Record<string, unknown>) {
      const res = await client.sign({
        chain: "ethereum",
        sign_mode: "typed_data",
        typed_data: typedData,
      });
      return res.signature_hex as Hex;
    },
  });
}

export async function createClayAccountFromSandbox(config: ClayConfig): Promise<LocalAccount> {
  const client = new ClaySandboxClient(config);
  const address = (await client.getRequiredAddress("ethereum")) as Address;
  return createClayAccount(config, address);
}
