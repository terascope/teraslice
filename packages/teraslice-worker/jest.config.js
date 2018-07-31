'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    globals: {
        __DEV__: true
    },
    bail: false,
    globalSetup: '<rootDir>/test/global.setup.js',
    globalTeardown: '<rootDir>/test/global.teardown.js',
    setupFiles: ['<rootDir>/test/env.setup.js'],
    setupTestFrameworkScriptFile: '<rootDir>/test/test.setup.js',
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
        '<rootDir>/lib/teraslice',
        '<rootDir>/lib/terafoundation',
        '<rootDir>/test/helpers',
        '<rootDir>/test/fixtures',
        '<rootDir>/test/env-setup.js',
        '<rootDir>/node_modules'
    ],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80
        }
    }
};
