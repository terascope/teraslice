'use strict';

const fs = require('fs');
const path = require('path');

const packagesPath = path.join(__dirname, 'packages');
const projects = fs
    .readdirSync(packagesPath)
    .filter((pkgName) => {
        const pkgDir = path.join(packagesPath, pkgName);

        if (!fs.statSync(pkgDir).isDirectory()) return false;
        const pkgPath = path.join(pkgDir, 'package.json');
        const hasPkg = fs.existsSync(pkgPath);
        if (hasPkg) {
            const { terascope = {} } = JSON.parse(fs.readFileSync(pkgPath));
            const { testSuite = 'disabled' } = terascope;
            if (testSuite === 'disabled') {
                return false;
            }
            return true;
        }
        return false;
    })
    .map(pkgName => `<rootDir>/packages/${pkgName}`);

module.exports = {
    rootDir: '.',
    verbose: true,
    projects,
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
        '!<rootDir>/packages/**/coverage/**'
    ],
    coverageReporters: ['lcov', 'text-summary', 'html'],
    coverageDirectory: '<rootDir>/coverage',
    preset: 'ts-jest'
};
