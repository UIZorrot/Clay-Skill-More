export function stripHexPrefix(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

export function bytesToHex(bytes: Uint8Array, prefix = true): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return prefix ? `0x${hex}` : hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = stripHexPrefix(hex);
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex payload must have an even number of characters");
  }

  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}

export function utf8ToHex(value: string): string {
  return bytesToHex(new TextEncoder().encode(value));
}

export function toBase64(bytes: Uint8Array): string {
  const maybeBuffer = (globalThis as typeof globalThis & {
    Buffer?: {
      from(data: Uint8Array): { toString(encoding: "base64"): string };
    };
  }).Buffer;

  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
