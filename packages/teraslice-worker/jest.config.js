'use strict';

const { jest: lernaAliases } = require('lerna-alias');

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    bail: false,
    globalSetup: '<rootDir>/test/global.setup.js',
    globalTeardown: '<rootDir>/test/global.teardown.js',
    setupFiles: ['<rootDir>/test/env.setup.js'],
    setupTestFrameworkScriptFile: '<rootDir>/test/test.setup.js',
    moduleNameMapper: lernaAliases({
        mainFields: ['main'],
    }),
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
