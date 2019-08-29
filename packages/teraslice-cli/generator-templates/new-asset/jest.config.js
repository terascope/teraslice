'use strict';

module.exports = {
    rootDir: '.',
    verbose: true,
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended'],
    testMatch: [
        '<rootDir>/test/*-spec.js'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/asset/**/*.js',
        '<rootDir>/asset/*/*.js',
        '!<rootDir>/asset/node_modules',
    ],
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage'
};
