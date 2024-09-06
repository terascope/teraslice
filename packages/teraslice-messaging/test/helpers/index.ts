import { promisify } from 'node:util';
import findPort from './find-port.js';

export const pDelay = promisify(setTimeout);
export { findPort };
