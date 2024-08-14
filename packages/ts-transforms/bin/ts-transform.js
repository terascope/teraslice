#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    // this path.join is only used for pkg asset injection
    path.join(dirname, '../package.json');
    import('../dist/src/command.js');
} catch (err) {
    // eslint-disable-next-line
    console.error('error while attempting to invoke cli command', err.toString());
    process.exit(1);
}
