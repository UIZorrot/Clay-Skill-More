export type SignMode = "transaction" | "personal_sign" | "typed_data" | "raw_hash";

export interface ClaySignRequest {
  chain: string;
  sign_mode: SignMode;
  uid: string;
  to?: string;
  amount_wei?: string;
  data?: string;
  tx_payload_hex?: string;
  typed_data?: Record<string, unknown>;
  derivation_path?: string;
}

export interface ClaySignResponse {
  signature_hex: string;
  from?: string;
}

export interface ClayConfig {
  uid: string;
  sandboxUrl: string;
  sandboxToken: string;
}

export interface ClayStatusResponse {
  uid?: string;
  address?: string;
  addresses?: Record<string, string>;
  master_pub_key?: string;
  status?: string;
}
