#!/bin/bash

echo "[entrypoint] Starting swap-packages..."
node /app/source/swap-packages.js
echo "[entrypoint] Running pnpm setup..."
pnpm run setup
echo "[entrypoint] Starting service..."
node /app/source/service.js
