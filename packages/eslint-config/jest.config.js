import { fileURLToPath } from 'node:url';
import baseConfig from '../../jest.make-root-config.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = baseConfig(dirPath, false);

config.globals.window = {};

export default config;
