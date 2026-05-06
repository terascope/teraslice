import { fileURLToPath } from 'node:url';
import makeConfig from '../../jest.pkgs.make-config.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = makeConfig(dirPath);

config.globals.window = {};

export default config;
