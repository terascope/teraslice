'use strict';

const base = require('./jest.config.base');

module.exports = Object.assign({}, base, {
    projects: [
        '<rootDir>/packages/*'
    ],
    globalSetup: '<rootDir>/packages/teraslice-worker/test/global.setup.js',
    globalTeardown: '<rootDir>/packages/teraslice-worker/test/global.teardown.js',
    testPathIgnorePatterns: [
        ...base.testPathIgnorePatterns,
        '/e2e/.*/test',
        '/packages/.*/dist'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/packages/**/*.{js,ts}',
        '!**/packages/**/dist/*.{js,ts}',
        '!**/examples/**',
        '!**/test/**',
        '!e2e/**'
    ],
});
