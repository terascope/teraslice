import { fileURLToPath } from 'node:url';
import baseConfig from '../../jest.make-root-config.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

// NOTE: flaky, fails a lot running in batch w/other packages in CI,
// moved here to run w/less packages even though it's hacky
const config = baseConfig(dirPath, false);

export default config;
