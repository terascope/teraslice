'use strict';

const config = require('../jest.config.base')(__dirname);

// TODO: update arrays to run tests specific to platform.
// First array is for tests skipped in kubernetes.
// Second array is for tests skipped in native.
config.testPathIgnorePatterns = process.env.TEST_PLATFORM === 'kubernetes' ? ['data/recovery-spec', 'cluster/worker-allocation-spec', 'cluster/state-spec'] : [];
config.collectCoverage = false;
delete config.transform;
// config.moduleNameMapper = {
//     '^(\\.{1,2}/.*)\\.js$': '$1',
// };
config.transform = {};
// config.transformIgnorePatterns = [];
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
//         type: 'commonjs',
//         strictMode: false,
//         noInterop: false
//     }
// }];

module.exports = config;
