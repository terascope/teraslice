import { fileURLToPath } from 'node:url';
import baseConfig from '../../jest.config.base.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = baseConfig(dirPath);

export default config;
