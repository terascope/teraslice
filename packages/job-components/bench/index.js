import { fileURLToPath } from 'url';
import start from '../../utils/bench.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

start('job-components', dirPath);
