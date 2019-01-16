import { promisify } from 'util';
import findPort from './find-port';

export const pDelay = promisify(setTimeout);
export { findPort };
