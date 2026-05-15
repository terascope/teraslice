import { fileURLToPath } from 'node:url';
import makeConfig from '../jest.make-root-config.js';
import { URL } from 'node:url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = makeConfig(dirPath, false);

config.collectCoverage = false;
config.testTimeout = 3 * 60 * 1000;

export default config;
