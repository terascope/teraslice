import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCI } from '@terascope/utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default (projectDir) => {
    let parentFolder;
    let workspaceName;
    let packageRoot;
    let rootDir;

    const name = path.basename(projectDir);
    const runInDir = process.cwd() !== dirname;

    if (name === 'e2e') {
        parentFolder = name;
        workspaceName = name;
        if (runInDir) {
            packageRoot = '<rootDir>';
            rootDir = './';
        } else {
            packageRoot = `<rootDir>/${name}`;
            rootDir = '../';
        }
    } else {
        parentFolder = 'packages';
        workspaceName = `packages/${name}`;
        packageRoot = `<rootDir>/${workspaceName}`;
        rootDir = '../../';
    }

    const isTypescript = fs.existsSync(path.join(projectDir, 'tsconfig.json'));

    const coverageReporters = ['lcov', 'html'];
    if (!isCI) {
        coverageReporters.push('text-summary');
    }
    const config = {
        rootDir,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended/all'],
        testMatch: [`${packageRoot}/test/**/*-spec.{ts,js}`, `${packageRoot}/test/*-spec.{ts,js}`],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${parentFolder}/*/node_modules`,
            `<rootDir>/${parentFolder}/*/dist`,
            `<rootDir>/${parentFolder}/teraslice-cli/test/fixtures/`
        ],
        transformIgnorePatterns: [],
        moduleNameMapper: {
            '^(\\.{1,2}/.*)\\.js$': '$1',
        },
        moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs', 'mjs'],
        extensionsToTreatAsEsm: ['.ts'],
        collectCoverage: true,
        coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
        watchPathIgnorePatterns: [],
        coverageReporters,
        coverageDirectory: `${packageRoot}/coverage`,
        watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
        workerIdleMemoryLimit: '200MB',
        testTimeout: 60 * 1000,
        globals:  {
            availableExtensions: ['.js', '.ts', '.mjs', 'cjs']
        },
        transform: {
            ['^.+\\.(t|j)sx?$']: ['@swc/jest', {
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
        roots: [`${packageRoot}/test`]
    };

    if (fs.existsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${packageRoot}/test/global.setup.js`;
    } else if (fs.existsSync(path.join(projectDir, 'test/global.setup.ts'))) {
        config.globalSetup = `${packageRoot}/dist/test/global.setup.js`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${packageRoot}/test/global.teardown.js`;
    } else if (fs.existsSync(path.join(projectDir, 'test/global.teardown.ts'))) {
        config.globalTeardown = `${packageRoot}/dist/test/global.teardown.js`;
    }

    if (fs.existsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupFilesAfterEnv.push(`${packageRoot}/test/test.setup.js`);
    }

    if (fs.existsSync(path.join(projectDir, 'lib'))) {
        config.roots.push(`${packageRoot}/lib`);
    } else if (fs.existsSync(path.join(projectDir, 'index.js'))) {
        config.roots.push(`${packageRoot}`);
    }

    if (fs.existsSync(path.join(projectDir, 'src'))) {
        config.roots.push(`${packageRoot}/src`);
    }

    if (fs.existsSync(path.join(projectDir, 'peg'))) {
        config.roots.push(`${packageRoot}/peg`);
    }

    return config;
};
