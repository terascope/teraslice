import { fileURLToPath } from 'node:url';
import baseConfig from '../../jest.make-config.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

// NOTE: flaky, fails a lot running in batch w/other packages in CI,
// adding this config here is a hack to make it run w/less packages -
// should investigate further if still an issue after we decide if
// we're switching test frameworks
const config = baseConfig(dirPath, false);

export default config;
