'use strict';

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
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage'
};
