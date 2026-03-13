---
name: Claw MPC Wallet
description: A highly secure, Progressive Onboarding wallet for Agents. Generates local private keys and uses Cloud Relay 2FA for signing transactions.
version: 5.0
---

# Claw Wallet Skill (Remote Auto-Bootstrap & API Protocol)

You are equipped with **Claw**, an ultra-secure, multi-chain MPC wallet. This skill allows you to manage assets securely without holding raw private keys.

### 🛑 CRITICAL SECURITY RULES
1. **Never print or store raw private keys.** You do not have access to them.
2. All signatures **must** be processed through your local **Claw Sandbox Daemon** (URL is in `.env.clay`).
3. `Share 2` is brokered by the Cloud Relay, while `Share 1` and `Share 3` are local.

---

## 0. Self-Installation (Bootstrap from Cloud)
If you cannot reach `{CLAY_SANDBOX_URL}/health`, you MUST install the Sandbox locally first. As an AI Agent, you should clone the skill repository to obtain the required installation scripts and binaries.

### Step 1: Clone the Skill Repository
Clone the dedicated skill repository to a local folder and navigate into it:
`git clone https://github.com/BitsLabSec/Claw_Wallet_Skill.git`
`cd Claw_Wallet_Skill`

### Step 2: Configure Cloud Relay & Execute
The Sandbox must communicate with the Cloud Relay to exchange `Share 2`.
Set the environment variable `$RELAY_URL` (or export it in bash) to the Cloud Relay address BEFORE running the script! For local testing, you can set it to `https://api.wallet.bitslab.xyz`.

Then execute the installer. It will automatically detect your OS, locate the pre-compiled Claw binary from the `bin` folder, and launch the daemon.
- **Windows** (PowerShell): `.\install.ps1`
- **Linux/Mac** (Bash): `bash ./install.sh`

### Step 3: Load Credentials
The script will generate an Identity Token. Read the newly created `.env.clay` file to get your `CLAY_AGENT_TOKEN` and `CLAY_SANDBOX_URL`. The installer may assign a port other than 9000 if 9000 is occupied.
Ensure `{CLAY_SANDBOX_URL}/health` returns `{"status":"ok"}`.

### Step 4: Access Your Local Web Gateway
The Sandbox daemon automatically serves a rich, embedded Local Web Gateway on its root path.
If your user (human owner) needs to inspect your wallet addresses, review security policies, or simulate transaction signing, they can simply open the Sandbox URL (e.g., `http://127.0.0.1:9000` or whatever port was assigned in `CLAY_SANDBOX_URL`) in their local web browser and log in with your `CLAY_AGENT_TOKEN`. No external dependencies or Node.js are required!

---

## 1. API Protocol (REST)
Once the sandbox is running, you must interact with it via HTTP requests.
All requests require the header `Authorization: Bearer <CLAY_AGENT_TOKEN>`.

### A. Initialize Wallet (Run this immediately after install)
**POST** `{CLAY_SANDBOX_URL}/api/v1/wallet/init`
- **Body**: `{}` (Empty JSON)
- **Action**: Generates key, syncs with the Cloud Relay (`8080`), and returns your identity.
- **Output to User**: "I have initialized my Claw wallet. Address: `0x...`, UID: `[UID]`."

> 🚨 **IMPORTANT: PERSIST YOUR UID** 🚨
> You MUST permanently store this UID (e.g., in your local config, `.env.clay` file, or your agent memory database). It is the critical identifier required for the user to manage your spending policies and activate/deactivate your wallet. DO NOT LOSE IT.

### B. Check Wallet Status & Policy limits
**GET** `{CLAY_SANDBOX_URL}/api/v1/wallet/status`
- **Response**: Returns address, master public key, and current spending policy (e.g., `daily_limit_wei`, `max_amount_per_tx`, `allowed_chains`, `whitelist_to`).
- **Risk Engine Warning**: Your transactions are subject to a strict risk control engine on both the Sandbox and Cloud Relay. Always check your current policy limits by calling this endpoint before attempting a transaction to avoid rejection. If a transaction is blocked by the policy, inform the user to update your limits via their Claw Web Console using your UID.

### C. Sign Transaction
**POST** `{CLAY_SANDBOX_URL}/api/v1/tx/sign`
- **Body Example**: 
  ```json
  {
    "chain": "ethereum", 
    "to": "0xRecipient...",
    "amount_wei": "1000000000000000000",
    "tx_payload_hex": "0xUnsignedRawHex..."
  }
  ```
- **Action**: The sandbox connects to the Cloud Relay, verifies your transaction against the user's policy, signs it, and securely wipes its memory.
- **Returns**: `{"signature_hex": "...", "from": "..."}`.

### D. Sign Arbitrary Message (Relay Loop)
The Cloud Relay may post "Arbitrary Message Signing" requests for you (e.g., for login or identity proof). You should poll for these tasks periodically.

> 🚨 **DUAL-CONSTRAINT POLICY**: All Cloud Relay endpoints now require BOTH your `agent_id` and your wallet `uid` for security validation. Do not send requests with only one of them.

1. **Poll for Tasks**: `GET {CLAY_RELAY_URL}/api/v1/agent/sign/poll?agent_id={AGENT_ID}&uid={UID}`
2. **Handle Task**: If you get a task with `sign_id` and `message_hash_hex`:
   - Call Sandbox: `POST {CLAY_SANDBOX_URL}/api/v1/tx/sign` with `sign_mode: "raw_hash"`, `uid: "{UID}"`, and `tx_payload_hex: "message_hash_hex"`.
   - Submit Result: `POST {CLAY_RELAY_URL}/api/v1/agent/sign/submit` with `{"sign_id": "...", "agent_id": "{AGENT_ID}", "uid": "{UID}", "signature_hex": "..."}`.

### E. Verify Signature (Utility)
Use this to check if a signed message is valid before acting on it.
**POST** `{CLAY_RELAY_URL}/api/v1/verify`
- **Body**: `{"public_key_hex": "03...", "message_hash_hex": "...", "signature_hex": "..."}`
- **Returns**: `{"valid": true/false}`.

---

## 3. Syncing & Updates
Claw is constantly improving. To ensure you have the latest security protocols and binary engines:


1. **Update Skill**: Download and read the latest skill from the repository [https://raw.githubusercontent.com/BitsLabSec/Claw_Wallet_Skill/main/SKILL.md].

2. **Update Daemon**: if you have cloned the repository, run `git pull` in the root folder. If you see a major version bump in `SKILL.md` or a "Binary mismatch" error, re-run the installer:
   - `powershell ./install.ps1` (Windows)
   - `bash ./install.sh` (Linux/Mac)
   This will download the latest pre-compiled `claw-sandbox` binary without affecting your existing `.env.clay` identity.

---

## 5. Developer Experience & Workflow

This section outlines the workflow and technical stack for developers maintaining or extending the Claw Wallet Sandbox and Gateway.

### A. Technical Stack
- **Backend**: Go (Golang) serving a JSON-RPC and REST API. Uses `go:embed` to serve the production frontend.
- **Frontend**: Vite + React + TypeScript + Vanilla CSS (Glassmorphism). Located in `clay-skill/frontend_gateway`.
- **Assets**: Multichain data provided by Alchemy (EVM), DexScreener (Pricing), and native RPCs (Sui, Solana).

### B. Development Workflow (Syncing UI)
To modify the Local Web Gateway:
1.  **Frontend Edits**: Modify files in `clay-skill/frontend_gateway/src`.
2.  **Build**: Run `npm run build` in the `frontend_gateway` directory.
3.  **Deploy to Sandbox**: Copy the contents of `dist/` to `sandbox/gateway_ui/`.
4.  **Restart Sandbox**: Restart the `claw-sandbox` daemon to serve the updated files.
    *   *Tip*: Use `bootstrap_sandbox.py` or `scripts/sync_skill.ps1` for automated build & sync tasks.

### C. Critical Learnings & Common Tasks
- **Sui History**: Sui RPCs may omit timestamps in bulk queries. Use a two-step process: (1) `suix_queryTransactionBlocks` to get digests, (2) `sui_multiGetTransactionBlocks` with `showTimestamp: true` to fetch metadata.
- **Security Policy**: Adding a new policy limit requires updating:
    *   The `Policy` struct in `sandbox/policy/policy.go`.
    *   The `/api/v1/wallet/status` response logic.
    *   The `PolicyView` component in `App.tsx` for UI configuration and `handleApply` logic.
- **UID Persistence**: The `uid` is saved in `identity.json`. Always ensure the frontend verifies this on mount.

### D. Testing Strategies
- **RPC Validation**: Use Python scripts (in `scripts/`) to verify specific RPC behaviors (e.g., `test_sui_single.py`) before implementing in Go.
- **Policy Enforcement**: Mock transaction payloads and test them against the `/api/v1/tx/sign` endpoint to ensure limits/whitelists are respected.


