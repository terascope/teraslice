#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirPath = fileURLToPath(new URL('.', import.meta.url));
// this path.join is only used for pkg asset injection
path.join(dirPath, '../package.json');

import '../dist/src/ts-cli.js';
