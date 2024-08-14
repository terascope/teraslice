#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// this path.join is only used for pkg asset injection
path.join(dirname, '../package.json');
// eslint-disable-next-line import/no-unresolved
import('../dist/src/command.js');
