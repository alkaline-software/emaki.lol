#!/usr/bin/env bash
# Write _releases.md from the app's GitHub releases, for releases.qmd.
#
# `release.yml` in the app repo puts each CHANGELOG.md section onto its release
# as the notes, so the API already holds exactly what this page wants and there
# is nothing to parse out of the changelog.
#
# Deliberately curl and jq rather than R or Python: the publish workflow
# installs neither, and both of these are on the runner already.
#
# It fails soft. _releases.md is committed, so an offline preview, a rate limit
# or an API hiccup leaves the last good copy in place instead of breaking the
# build. Quarto runs this as a pre-render step.

set -uo pipefail

REPO="alkaline-software/emaki"
OUT="_releases.md"
API="https://api.github.com/repos/${REPO}/releases?per_page=100"

keep() {
  echo "fetch-releases: $1" >&2
  if [ -s "$OUT" ]; then
    echo "fetch-releases: keeping the committed ${OUT}" >&2
    exit 0
  fi
  echo "fetch-releases: no ${OUT} to fall back on; writing a placeholder" >&2
  printf 'The version history could not be fetched. See the\n[releases on GitHub](https://github.com/%s/releases).\n' "$REPO" > "$OUT"
  exit 0
}

command -v curl >/dev/null 2>&1 || keep "curl not found"
command -v jq >/dev/null 2>&1 || keep "jq not found"

# Authorize when a token is around: unauthenticated calls are capped at 60 an
# hour per IP, which a shared CI runner can easily have spent already. One
# header either way, since bash 3.2 (what a Mac has) cannot expand an empty
# array under `set -u`.
auth_header="X-Emaki-Docs: 1"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  auth_header="Authorization: Bearer ${GITHUB_TOKEN}"
fi

raw=$(curl -fsSL --max-time 30 \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "$auth_header" "$API") || keep "the releases API could not be reached"

md=$(printf '%s' "$raw" | jq -r '
  def months: ["January","February","March","April","May","June","July",
               "August","September","October","November","December"];
  def pretty: (.[8:10] | ltrimstr("0")) + " " + months[(.[5:7] | tonumber) - 1]
              + " " + .[0:4];
  [ .[]
    | select(.draft == false and .prerelease == false)
    | "## " + .tag_name + " · " + (.published_at | pretty) + "\n\n"
      + (.body // "" | gsub("\r"; "") | sub("^\n+"; "") | sub("\n+$"; ""))
      + "\n"
  ] | join("\n")
') || keep "the API answer could not be read"

case "$md" in
  "## v"*) ;;
  *) keep "the API answer held no releases" ;;
esac

printf '%s' "$md" > "$OUT"
echo "fetch-releases: wrote ${OUT} ($(grep -c '^## ' "$OUT") releases)"
