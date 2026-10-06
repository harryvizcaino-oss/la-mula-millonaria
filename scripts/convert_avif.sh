#!/bin/bash
# Convierte PNGs > 1MB a AVIF en public/assets-avif (misma estructura).
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p public/assets-avif

find public -name "*.png" -size +1000k -print0 | while IFS= read -r -d '' f; do
  rel="${f#public/}"
  out="public/assets-avif/${rel%.png}.avif"
  mkdir -p "$(dirname "$out")"
  if sips -s format avif "$f" --out "$out" >/dev/null 2>&1; then
    echo "OK  $rel -> assets-avif/${rel%.png}.avif ($(stat -f%z "$out") bytes)"
  else
    echo "FAIL $rel"
  fi
done

echo "--- total ---"
du -sh public/assets-avif
