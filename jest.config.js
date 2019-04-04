'use strict';

module.exports = {
    rootDir: '.',
    verbose: true,
    projects: ['<rootDir>/packages/*'],
    globals: {
        availableExtensions: ['.js', '.ts']
    },
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
        '<rootDir>/packages/teraslice-cli/test/fixtures/'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/packages/*/index.js',
        '<rootDir>/packages/*/lib/*.js',
        '<rootDir>/packages/*/lib/**/*.js',
        '<rootDir>/packages/*/cmds/*.js',
        '<rootDir>/packages/*/cmds/**/*.js',
        '<rootDir>/packages/*/src/**/*.ts',
        '<rootDir>/packages/*/src/*.ts',
        '!<rootDir>/packages/**/*.json',
        '!<rootDir>/packages/**/*.d.ts',
        '!<rootDir>/packages/**/dist/**',
        '!<rootDir>/packages/**/coverage/**',
    ],
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage',
    preset: 'ts-jest'
};
