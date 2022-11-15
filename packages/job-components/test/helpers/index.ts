import path from 'path';
import { fileURLToPath } from 'url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

export const terasliceOpPath = path.join(
    dirPath,
    '..',
    '..',
    '..',
    'teraslice',
    'lib'
);
