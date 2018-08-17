'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    roots: [
        '<rootDir>/src',
        '<rootDir>/test'
    ],
    setupTestFrameworkScriptFile: 'jest-extended',
    transform: {
        '\\.ts$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/examples/',
        '/fixtures/',
        '\\.snap$',
    ],
    testRegex: '/test/.*spec\\.(ts|js)$',
    moduleFileExtensions: [
        'ts',
        'js',
        'json',
        'node'
    ],
    transformIgnorePatterns: [
        '/node_modules/'
    ],
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        '**/test/helpers',
        '**/test/fixtures',
        '**/test/.*(?!spec)\\.(ts|js)$',
        '**/node_modules',
        '**/dist'
    ],
    coverageReporters: ['lcov', 'text', 'html'],
    coverageDirectory: 'coverage'
};
