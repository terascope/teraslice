import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// import { isCI } from '@terascope/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const packagesPath = path.join(dirname, 'packages');
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
    .map((pkgName) => `<rootDir>/packages/${pkgName}`);

// const coverageReporters = ['lcov', 'html'];

// if (!isCI) {
//     coverageReporters.push('text-summary');
// }

export default {
    rootDir: '.',
    verbose: true,
    testTimeout: 60 * 1000,
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
    projects,
    globals: {
        availableExtensions: ['.js', '.ts', '.mjs', '.cjs'],
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
    // collectCoverage: true,
    // collectCoverageFrom: [
    //     '<rootDir>/packages/*/index.js',
    //     '<rootDir>/packages/*/lib/*.js',
    //     '<rootDir>/packages/*/lib/**/*.js',
    //     '<rootDir>/packages/*/cmds/*.js',
    //     '<rootDir>/packages/*/cmds/**/*.js',
    //     '<rootDir>/packages/*/src/**/*.ts',
    //     '<rootDir>/packages/*/src/*.ts',
    //     '!<rootDir>/packages/**/*.json',
    //     '!<rootDir>/packages/**/*.d.ts',
    //     '!<rootDir>/packages/**/dist/**',
    //     '!<rootDir>/packages/**/coverage/**'
    // ],
    // coverageReporters,
    // coverageDirectory: '<rootDir>/coverage',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        ['^.+\\.(t|j)sx?$']: ['@swc/jest',
            {
                jsc: {
                    loose: true,
                    parser: {
                        syntax: 'typescript',
                        tsx: false,
                        decorators: true
                    },
                    transform: {
                        legacyDecorator: true,
                        decoratorMetadata: true
                    },
                    target: 'esnext'
                },
                module: {
                    type: 'es6',
                    strictMode: false,
                    noInterop: false,
                    ignoreDynamic: true
                }
            }]
    },
};
