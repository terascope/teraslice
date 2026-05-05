import { fileURLToPath } from 'node:url';
import makeConfig from '../../jest.make-config.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = makeConfig([dirPath], false);

config.globals.window = {};

export default config;
