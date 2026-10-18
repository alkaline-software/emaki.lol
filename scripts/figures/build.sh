#!/usr/bin/env bash
# Writes js/figures.js: Hairline's engine and the six of Emaki's parts
# drawn on it
# (scripts/figures/emaki/), as one plain script, bundled from Hairline's
# source at the tag below so the site loads nothing from a CDN. Needs git, node 22 or
# later and npm; the output is committed, so a render needs none of them.
set -euo pipefail
cd "$(dirname "$0")/../.."

TAG=v0.5.1
ESBUILD=0.28.2
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

git clone --quiet --depth 1 --branch "$TAG" https://github.com/lucasmarkes/hairline "$work/hairline"
(cd "$work" && npm init --yes >/dev/null && npm install --silent --no-audit --no-fund "esbuild@$ESBUILD")

"$work/node_modules/.bin/esbuild" scripts/figures/entry.js \
  --bundle --format=iife --target=es2020 --minify \
  --alias:hairline="$work/hairline/packages/hairline/src" \
  --banner:js="/* emaki.lol figures: @lucasmarkes/hairline $TAG (MIT, Lucas Marques; scripts/figures/HAIRLINE-LICENSE), and Emaki's own on it (scripts/figures/emaki/). Built by scripts/figures/build.sh; do not edit. */" \
  --outfile=js/figures.js

echo "js/figures.js: $(wc -c < js/figures.js) bytes"
