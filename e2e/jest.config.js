'use strict';

const config = require('../jest.config.base')(__dirname);

// TODO: update arrays to run tests specific to platform.
// First array is for tests skipped in kubernetes.
// Second array is for tests skipped in native.
config.testPathIgnorePatterns = process.env.TEST_PLATFORM === 'kubernetes' ? ['data/recovery-spec', 'cluster/worker-allocation-spec', 'cluster/state-spec'] : [];
config.collectCoverage = false;
delete config.transform;
module.exports = config;
