import path from 'node:path';
import { fileURLToPath } from 'node:url';
import start from'../../utils/bench';

const dirname = path.dirname(fileURLToPath(import.meta.url));

start('job-components', dirname);
