'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    transform: {
        '\\.ts$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ],
    testRegex: '/test/.*spec\\.(ts|js)$',
    moduleFileExtensions: [
        'ts',
        'js',
        'json'
    ],
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
