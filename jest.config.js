'use strict';

const base = require('./jest.config.base');

module.exports = Object.assign({}, base, {
    projects: [
        '<rootDir>/packages/*'
    ],
    globalSetup: '<rootDir>/packages/teraslice-worker/test/global.setup.js',
    globalTeardown: '<rootDir>/packages/teraslice-worker/test/global.teardown.js',
    testPathIgnorePatterns: [
        '/node_modules/',
        '/examples/',
        '/e2e/.*/test',
        '\\.snap$',
        '/packages/.*/dist',
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/packages/*/**/*.js',
        '**/packages/*/**/*.ts',
        '!**/examples/**',
        '!**/test/**',
        '!e2e/**',
    ]
});
