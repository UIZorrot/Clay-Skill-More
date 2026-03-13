#!/bin/bash
# CLAY Minimal Installer for Linux/Mac

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

OS_TYPE="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH_TYPE="$(uname -m)"

BINARY_NAME="clay-sandbox-linux-amd64"
if [ "$OS_TYPE" == "darwin" ]; then
    if [ "$ARCH_TYPE" == "arm64" ]; then
        BINARY_NAME="clay-sandbox-darwin-arm64"
    else
        BINARY_NAME="clay-sandbox-darwin-amd64"
    fi
fi

BINARY_SOURCE="./bin/$BINARY_NAME"
BINARY_URL="https://raw.githubusercontent.com/UIZorrot/Clay-Skill-More/main/bin/$BINARY_NAME"
BINARY_TARGET="./clay-sandbox"

# 1. Prepare Binary
if [ ! -f "$BINARY_TARGET" ]; then
    if [ -f "$BINARY_SOURCE" ]; then
        cp "$BINARY_SOURCE" "$BINARY_TARGET"
    else
        echo "Downloading Sandbox Binary from $BINARY_URL ..."
        curl -L -o "$BINARY_TARGET" "$BINARY_URL"
    fi
    chmod +x "$BINARY_TARGET"
fi

# 2. Launch Daemon
# The sandbox will auto-generate .env.clay if it doesn't exist
pkill -f clay-sandbox || true
nohup "$BINARY_TARGET" > sandbox.log 2>&1 &

echo "✅ CLAY Sandbox is launching..."
echo "Wait a few seconds, then check .env.clay for your AGENT_TOKEN and URL."


# Note: Identity and config are persistent. To reset, delete .env.clay, identity.json and share3.json.
