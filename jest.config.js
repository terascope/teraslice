'use strict';

module.exports = {
    rootDir: '.',
    verbose: true,
    projects: ['<rootDir>/packages/*'],
    globalSetup: '<rootDir>/packages/teraslice-worker/test/global.setup.js',
    globalTeardown: '<rootDir>/packages/teraslice-worker/test/global.teardown.js',
    testMatch: [
        '<rootDir>/packages/*/test/**/*-spec.{ts,js}',
        '<rootDir>/packages/*/test/*-spec.{ts,js}'
    ],
    testPathIgnorePatterns: [
        '/coverage/',
        '/docs/',
        '<rootDir>/assets/',
        '/examples/',
        '<rootDir>/e2e/',
        '<rootDir>/packages/*/dist',
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/packages/*/index.js',
        '<rootDir>/packages/*/lib/*.js',
        '<rootDir>/packages/*/lib/**/*.js',
        '<rootDir>/packages/*/src/**/*.ts',
        '<rootDir>/packages/*/src/*.ts',
        '!<rootDir>/packages/**/*.d.ts',
        '!<rootDir>/packages/**/dist/**',
        '!<rootDir>/packages/**/coverage/**',
    ],
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage'
};
