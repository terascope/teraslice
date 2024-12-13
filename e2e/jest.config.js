import { fileURLToPath } from 'node:url';
import baseConfig from '../jest.config.base.js';
import { URL } from 'node:url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config = baseConfig(dirPath);

// TODO: update arrays to run tests specific to platform.
// First array is for tests skipped in kubernetes.
// Second array is for tests skipped in native.
config.testPathIgnorePatterns = process.env.CLUSTERING_TYPE !== 'native' ? ['data/recovery-spec', 'cluster/worker-allocation-spec', 'cluster/state-spec'] : [];
config.collectCoverage = false;
config.testTimeout = 3 * 60 * 1000;

export default config;
