#!/usr/bin/env bash
set -euo pipefail

ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

case "$ARCH" in
  x86_64) ARCH="64" ;;
  aarch64) ARCH="arm64-v8a" ;;
esac

LATEST_VERSION=$(curl -s https://api.github.com/repos/XTLS/Xray-core/releases/latest | grep tag_name | cut -d '"' -f 4)
DOWNLOAD_URL="https://github.com/XTLS/Xray-core/releases/download/${LATEST_VERSION}/Xray-${OS}-${ARCH}.zip"

echo "Downloading Xray from $DOWNLOAD_URL"
wget -O /tmp/xray.zip "$DOWNLOAD_URL"
unzip -o /tmp/xray.zip -d /usr/local/bin/
chmod +x /usr/local/bin/xray
rm /tmp/xray.zip

echo "Xray ${LATEST_VERSION} installed successfully!"
