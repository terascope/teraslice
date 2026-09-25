#!/usr/bin/env node

// Installs and verifies the DuckDB extensions at image build time; see
// src/duck-frame/extension-tools.ts. The logic is compiled TypeScript in dist.
import('../dist/src/duck-frame/extensions-cli.js').catch((err) => {
    console.error('error while attempting to invoke duckdb-extensions', err.toString());
    process.exit(1);
});
