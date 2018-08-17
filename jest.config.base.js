'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    roots: [
        '<rootDir>/src',
        '<rootDir>/spec',
        '<rootDir>/test'
    ],
    setupTestFrameworkScriptFile: 'jest-extended',
    transform: {
        '\\.ts$': 'ts-jest'
    },
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/fixtures/'
    ],
    testRegex: '/test/.*spec\\.(ts|js)$',
    moduleFileExtensions: [
        'ts',
        'js',
        'json',
        'node'
    ],
    transformIgnorePatterns: [
        '/node_modules/',
    ],
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        '<rootDir>/test/helpers',
        '<rootDir>/test/fixtures',
        '<rootDir>/test/.*(?!spec)\\.(ts|js)$',
        '<rootDir>/node_modules'
    ],
    coverageReporters: ['lcov', 'text', 'html'],
    coverageDirectory: 'coverage'
};
