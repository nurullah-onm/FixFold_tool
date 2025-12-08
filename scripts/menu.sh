#!/usr/bin/env bash
set -euo pipefail

green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:4000/api/health}"

menu() {
  clear
  cat <<'EOF'
FixFold Terminal Menüsü
-----------------------
1) PM2 durum
2) Backend log (fixfold-backend)
3) Frontend log (fixfold-frontend)
4) Backend restart
5) Frontend restart
6) Tüm servisleri restart
7) Sağlık kontrolü (API health)
8) PM2 log tail (tüm)
9) Çıkış
EOF
  echo -n "Seçiminiz: "
}

health_check() {
  echo "Health: $API_URL"
  curl -fsSL "$API_URL" || echo "Health isteği başarısız."
  read -rp "Devam için Enter..."
}

pm2_status() {
  pm2 status
  read -rp "Devam için Enter..."
}

pm2_logs() {
  local name="$1"
  pm2 logs "$name"
}

pm2_restart() {
  local name="$1"
  pm2 restart "$name" && pm2 status "$name"
  read -rp "Devam için Enter..."
}

pm2_tail_all() {
  pm2 logs
}

while true; do
  menu
  read -r choice
  case "$choice" in
    1) pm2_status ;;
    2) pm2_logs fixfold-backend ;;
    3) pm2_logs fixfold-frontend ;;
    4) pm2_restart fixfold-backend ;;
    5) pm2_restart fixfold-frontend ;;
    6) pm2 restart fixfold-backend && pm2 restart fixfold-frontend && pm2 status; read -rp "Devam için Enter..." ;;
    7) health_check ;;
    8) pm2_tail_all ;;
    9) exit 0 ;;
    *) echo "Geçersiz seçim"; sleep 1 ;;
  esac
done
