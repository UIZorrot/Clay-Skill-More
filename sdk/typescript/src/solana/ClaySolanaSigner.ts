import { Buffer } from "buffer";

import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

import { ClaySandboxClient } from "../common/client";
import { bytesToHex, hexToBytes } from "../common/encoding";
import { ClayConfig } from "../common/types";

export type ClaySolanaTransaction = Transaction | VersionedTransaction;

function isVersionedTransaction(tx: ClaySolanaTransaction): tx is VersionedTransaction {
  return tx instanceof VersionedTransaction;
}

function serializeTransactionMessage(tx: ClaySolanaTransaction): Uint8Array {
  return isVersionedTransaction(tx) ? tx.message.serialize() : tx.serializeMessage();
}

function attachSignature(
  tx: ClaySolanaTransaction,
  publicKey: PublicKey,
  signature: Uint8Array,
): ClaySolanaTransaction {
  if (isVersionedTransaction(tx)) {
    tx.addSignature(publicKey, signature);
    return tx;
  }

  tx.addSignature(publicKey, Buffer.from(signature));
  return tx;
}

/**
 * Solana adapter for Clay.
 * Supports both legacy and versioned transactions for `@solana/web3.js`,
 * and exposes a small compatibility surface for `@solana/kit`.
 */
export class ClaySolanaSigner {
  readonly publicKey: PublicKey;
  private readonly client: ClaySandboxClient;

  constructor(config: ClayConfig, publicKey: string | PublicKey) {
    this.client = new ClaySandboxClient(config);
    this.publicKey = typeof publicKey === "string" ? new PublicKey(publicKey) : publicKey;
  }

  static async fromSandbox(config: ClayConfig): Promise<ClaySolanaSigner> {
    const client = new ClaySandboxClient(config);
    const address = await client.getRequiredAddress("solana");
    return new ClaySolanaSigner(config, address);
  }

  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  async signTransaction<T extends ClaySolanaTransaction>(transaction: T): Promise<T> {
    const res = await this.client.sign({
      chain: "solana",
      sign_mode: "transaction",
      tx_payload_hex: bytesToHex(serializeTransactionMessage(transaction)),
    });

    return attachSignature(transaction, this.publicKey, hexToBytes(res.signature_hex)) as T;
  }

  async signAllTransactions<T extends ClaySolanaTransaction>(transactions: readonly T[]): Promise<T[]> {
    return Promise.all(transactions.map((transaction) => this.signTransaction(transaction)));
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const res = await this.client.sign({
      chain: "solana",
      sign_mode: "personal_sign",
      tx_payload_hex: bytesToHex(message),
    });

    return hexToBytes(res.signature_hex);
  }

  /**
   * Compatibility layer for `@solana/kit` style signers.
   */
  toKeyPairSigner() {
    return {
      address: this.publicKey.toBase58(),
      publicKey: this.publicKey.toBytes(),
      signMessage: (message: Uint8Array) => this.signMessage(message),
      signTransaction: <T extends ClaySolanaTransaction>(transaction: T) => this.signTransaction(transaction),
      signTransactions: <T extends ClaySolanaTransaction>(transactions: readonly T[]) =>
        this.signAllTransactions(transactions),
    };
  }
}
