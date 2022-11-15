import { fileURLToPath } from 'url';
import base from '../../jest.config.base.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

export default base(dirPath)
