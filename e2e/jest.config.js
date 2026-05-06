import { fileURLToPath } from 'node:url';
import makeConfig from '../jest.make-pkg-config.js';
import { URL } from 'node:url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = makeConfig(dirPath);

config.collectCoverage = false;
config.testTimeout = 3 * 60 * 1000;

export default config;
