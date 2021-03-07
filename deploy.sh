#!/bin/bash

set -euo pipefail
cd "$(dirname "$0")"

test -d .tmp/mahadana.github.io || exit 1
make
rm -rf .tmp/mahadana.github.io/ccb
cp -r dist .tmp/mahadana.github.io/ccb

cd .tmp/mahadana.github.io
perl -pi -e "s/^<!-- Last updated.+$/<!-- Last updated: $(date) -->/" index.html
git add .

arg="${1:-}"
if [ "$arg" = "commit" ]; then
  git commit -m 'Update ccb'
  git push
else
  git diff --cached
  echo "Re-run with '$0 commit' to commit and deploy"
fi
