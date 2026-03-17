import { fileURLToPath } from 'node:url';
import baseConfig from '../jest.config.base.js';
import { URL } from 'node:url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = baseConfig(dirPath);

config.collectCoverage = false;
config.testTimeout = 3 * 60 * 1000;

export default config;
