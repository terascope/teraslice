'use strict';

const { jest: lernaAliases } = require('lerna-alias');

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    transform: {
        '\\.ts$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '/node_modules/',
        '/lib/'
    ],
    testRegex: '/test/.*spec\\.(ts|js)$',
    moduleFileExtensions: [
        'ts',
        'js',
        'json'
    ],
    moduleNameMapper: lernaAliases({
        mainFields: ['main'],
    }),
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80
        }
    }
};
