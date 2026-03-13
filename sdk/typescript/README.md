# CLAY TypeScript SDK

Thin compatibility adapters that let partner scripts use a local CLAY sandbox as a standard wallet object.

## What This SDK Is

CLAY is sandbox-first:

- `sandbox.exe` is the local signing backend
- `claw-wallet-skill` installs and boots the sandbox for OpenClaw users
- this SDK only adapts the sandbox HTTP API into standard library shapes

The SDK runs inside the partner's own script runtime, not inside the sandbox.

```text
partner script (Node.js)
  -> Clay adapter
  -> http://127.0.0.1:xxxx/api/v1/...
  -> local CLAY sandbox
```

## Prerequisites

After the user installs `claw-wallet-skill`, the machine should have:

- `CLAY_SANDBOX_URL`
- `CLAY_AGENT_TOKEN`
- `CLAY_UID`

You can load them from the generated `.env.clay`.

```ts
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env.clay") });
```

Shared config:

```ts
const clayConfig = {
  uid: process.env.CLAY_UID!,
  sandboxUrl: process.env.CLAY_SANDBOX_URL!,
  sandboxToken: process.env.CLAY_AGENT_TOKEN!,
};
```

## Ethers

Replace `new Wallet(PRIVATE_KEY, provider)` with `ClayEthersSigner`.

```ts
import { ethers } from "ethers";
import { ClayEthersSigner } from "@bitslab/clay-sdk";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const signer = new ClayEthersSigner(clayConfig, provider);

const contract = new ethers.Contract(process.env.TOKEN!, abi, signer);
await contract.transfer(process.env.RECIPIENT!, 1n);
```

## Viem

If you already know the EVM address, use `createClayAccount`.
If you want the SDK to fetch it from sandbox status, use `createClayAccountFromSandbox`.

```ts
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { createClayAccountFromSandbox } from "@bitslab/clay-sdk";

const account = await createClayAccountFromSandbox(clayConfig);
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http(process.env.RPC_URL!),
});

await walletClient.sendTransaction({
  to: process.env.RECIPIENT! as `0x${string}`,
  value: 1n,
});
```

## Solana

Use `ClaySolanaSigner.fromSandbox()` to resolve the wallet public key from sandbox status.

```ts
import { Connection, SystemProgram, Transaction } from "@solana/web3.js";
import { ClaySolanaSigner } from "@bitslab/clay-sdk";

const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
const signer = await ClaySolanaSigner.fromSandbox(clayConfig);

const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: signer.getPublicKey(),
    toPubkey: signer.getPublicKey(),
    lamports: 1,
  }),
);

tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
tx.feePayer = signer.getPublicKey();

const signed = await signer.signTransaction(tx);
await connection.sendRawTransaction(signed.serialize());
```

## Sui

Use `ClaySuiSigner.fromSandbox()` to resolve the Sui address from sandbox status.

```ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { ClaySuiSigner } from "@bitslab/clay-sdk";

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });
const signer = await ClaySuiSigner.fromSandbox(clayConfig);

const tx = new Transaction();
tx.setSender(await signer.getAddress());

const bytes = await tx.build({ client });
const signed = await signer.signTransactionBlock(bytes);

await client.executeTransactionBlock({
  transactionBlock: signed.bytes,
  signature: signed.signature,
});
```

## Operational Notes

- The sandbox must already be initialized and unlocked.
- The SDK does not replace RPC providers. Chain reads and broadcasts still use your normal RPC endpoint.
- Existing partner scripts usually only need to replace wallet initialization, not business logic.
