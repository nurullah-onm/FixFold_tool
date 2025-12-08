#!/usr/bin/env bash
set -euo pipefail

green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }

# One-shot installer for FixFold (Ubuntu/Debian)
# Usage: bash <(curl -Ls https://raw.githubusercontent.com/nurullah-onm/FixFold_tool/main/scripts/install.sh)

SCRIPT_SOURCE="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_SOURCE")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
REPO_URL="https://github.com/nurullah-onm/FixFold_tool.git"

# If script is downloaded alone (no repo), clone to temp
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  green "Repo klasörü bulunamadı, klonlanıyor..."
  WORKDIR="$(mktemp -d)"
  git clone "$REPO_URL" "$WORKDIR/FixFold_tool"
  ROOT_DIR="$WORKDIR/FixFold_tool"
  BACKEND_DIR="$ROOT_DIR/backend"
  FRONTEND_DIR="$ROOT_DIR/frontend"
fi

if [ "$(id -u)" -ne 0 ]; then
  red "Lütfen root (sudo) olarak çalıştırın."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  yellow "curl kuruluyor..."
  apt-get update -y
  apt-get install -y curl
fi

OS=$(awk -F= '/^ID=/{print $2}' /etc/os-release)
if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
  yellow "Bu kurulum Ubuntu/Debian için hazırlandı. Diğer dağıtımlarda dikkatli kullanın."
fi

green "apt güncelleniyor ve bağımlılıklar kuruluyor..."
apt-get update -y
apt-get install -y ca-certificates gnupg lsb-release git unzip sqlite3

# Force Node.js 20 (Vite requires >=20.19)
rm -f /etc/apt/sources.list.d/nodesource.list /etc/apt/sources.list.d/nodesource.list.dpkg-old 2>/dev/null || true
green "Node.js 20 LTS kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

green "Backend bağımlılıkları kuruluyor..."
cd "$BACKEND_DIR"
npm install
npx prisma generate

# Ensure DATABASE_URL is set (SQLite default)
export DATABASE_URL=${DATABASE_URL:-"file:./dev.db"}

green "Veritabanı migrasyonu çalıştırılıyor..."
if ! npx prisma migrate deploy; then
  yellow "migrate deploy başarısız, prisma db push deneniyor..."
  npx prisma db push
fi

green "Admin kullanıcısı ekleniyor (admin/admin1234)..."
SEED_ADMIN_USER=${SEED_ADMIN_USER:-admin}
SEED_ADMIN_PASS=${SEED_ADMIN_PASS:-admin1234}
SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL:-admin@example.com}
SEED_ADMIN_USER="$SEED_ADMIN_USER" SEED_ADMIN_PASS="$SEED_ADMIN_PASS" SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" npm run seed:admin || true

green "pm2 ile backend başlatılıyor (fixfold-backend)..."
pm2 delete fixfold-backend >/dev/null 2>&1 || true
pm2 start npm --name fixfold-backend -- run start
pm2 save

green "Frontend bağımlılıkları kuruluyor..."
cd "$FRONTEND_DIR"
npm install
npm run build
if ! command -v serve >/dev/null 2>&1; then
  npm install -g serve
fi

green "pm2 ile frontend başlatılıyor (port 4173)..."
pm2 delete fixfold-frontend >/dev/null 2>&1 || true
pm2 start "serve -s dist -l 4173" --name fixfold-frontend
pm2 save

IP_ADDR=$(hostname -I | awk '{print $1}')
API_PORT=${API_PORT:-4000}
green "------------------------------------------------------------------"
green "FixFold kurulumu tamamlandı."
echo "Backend: http://${IP_ADDR}:${API_PORT}/api/health"
echo "Frontend: http://${IP_ADDR}:4173"
echo "Varsayılan admin: ${SEED_ADMIN_USER} / ${SEED_ADMIN_PASS}"
echo "pm2 durum: pm2 status"
green "------------------------------------------------------------------"
