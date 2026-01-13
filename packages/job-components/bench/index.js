import path from 'node:path';
import { fileURLToPath } from 'node:url';
import start from '@terascope/core-utils/bench/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

start('job-components', dirname);
