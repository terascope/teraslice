import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirPath = fileURLToPath(new URL('.', import.meta.url));
const configModulePath = path.join(dirPath, '../../jest.config.base.js');

const module = await import(configModulePath);

const config = module.default(dirPath);

config.globals.window = {};

export default config;
