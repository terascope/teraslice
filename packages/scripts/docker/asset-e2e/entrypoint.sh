#!/bin/bash
set -euo pipefail

node /app/source/swap-packages.js
pnpm run setup
node /app/source/service.js
