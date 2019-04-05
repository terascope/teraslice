'use strict';

module.exports = {
    rootDir: '.',
    verbose: true,
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended'],
    globals: {
        availableExtensions: ['.js', '.ts']
    },
    testMatch: [
        '<rootDir>/test/*-spec.{ts,js}'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/asset/*/processor.js',
    ],
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage',
    preset: 'ts-jest'
};
