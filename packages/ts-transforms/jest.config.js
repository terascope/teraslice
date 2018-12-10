'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    setupTestFrameworkScriptFile: 'jest-extended',
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage',
    testMatch: [
        '<rootDir>/tests/**/*-spec.{ts,js}',
        '<rootDir>/tests/*-spec.{ts,js}',
    ],
    preset: 'ts-jest',
    globals: {
        'test-jest': {
            tsConfig: './tsconfig.json',
            diagnostics: true,
            pretty: true,
        }
    }
};