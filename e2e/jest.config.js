import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dirPath = fileURLToPath(new URL('.', import.meta.url));
const configModulePath = path.join(dirPath, '../jest.config.base.js');

const module = await import(configModulePath);

const config = module.default(dirPath);

// TODO: update arrays to run tests specific to platform.
// First array is for tests skipped in kubernetes.
// Second array is for tests skipped in native.
config.testPathIgnorePatterns = process.env.TEST_PLATFORM === 'kubernetes' ? ['data/recovery-spec', 'cluster/worker-allocation-spec', 'cluster/state-spec'] : [];
config.collectCoverage = false;
config.testTimeout = 3 * 60 * 1000;

config.extensionsToTreatAsEsm = ['.ts'];
config.moduleNameMapper = {
    '^(\\.{1,2}/.*)\\.js$': '$1',
};
config.transform = {};

config.transform['^.+\\.(t|j)sx?$'] = '@swc/jest';

// config.transform['^.+\\.(t|j)sx?$'] = ['@swc/jest', {
//     jsc: {
//         loose: true,
//         parser: {
//             syntax: 'typescript',
//             tsx: false,
//             decorators: true
//         },
//         transform: {
//             legacyDecorator: true,
//             decoratorMetadata: true
//         },
//         target: 'es2022'
//     },
//     module: {
//         type: "es6",
//         strictMode: false,
//         noInterop: false,
//         ignoreDynamic: true
//     }
// }];

export default config;
