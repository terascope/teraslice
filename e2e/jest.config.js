'use strict';

const config = require('../jest.config.base')(__dirname);

// FIXME update arrays to run tests specific to platform
config.testPathIgnorePatterns = process.env.TEST_PLATFORM === 'kubernetes' ? ['data/recovery-spec', 'cluster/worker-allocation-spec', 'cluster/state-spec'] : [];
config.collectCoverage = false;
delete config.transform;
module.exports = config;
