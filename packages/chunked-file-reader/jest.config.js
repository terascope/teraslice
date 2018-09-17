'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    setupTestFrameworkScriptFile: 'jest-extended',
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage',
    testMatch: [
        '<rootDir>/test/**/*-spec.{ts,js}',
        '<rootDir>/test/*-spec.{ts,js}',
    ],
};
