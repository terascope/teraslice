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

    const coverageReporters = ['lcov'];

    if (!isCI) {
        coverageReporters.push('text-summary');
    }

    const config = {
        rootDir,
        displayName: name,
        testEnvironment: 'node',
        testTimeout: 60 * 1000,
        setupFilesAfterEnv: ['jest-extended/all'],
        testMatch: [`${packageRoot}/test/**/*-spec.{ts,js}`, `${packageRoot}/test/*-spec.{ts,js}`],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${parentFolder}/*/node_modules`,
            `<rootDir>/${parentFolder}/*/dist`,
            `<rootDir>/${parentFolder}/teraslice-cli/test/fixtures/`
        ],
        // do not run transforms on node_modules or pnp files
        transformIgnorePatterns: [
            '/node_modules/',
            '\\.pnp\\.[^\\/]+$'],
        moduleNameMapper: {
            '^(\\.{1,2}/.*)\\.js$': '$1',
        },
        moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs', 'mjs'],
        extensionsToTreatAsEsm: ['.ts'],
        coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
        watchPathIgnorePatterns: [],
        coverageDirectory: `${packageRoot}/coverage`,
        workerIdleMemoryLimit: '200MB',
        globals: {
            availableExtensions: ['.js', '.ts', '.mjs', 'cjs'],
        },
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
        roots: [`${packageRoot}/test`],
        collectCoverage: true,
        coverageReporters: coverageReporters
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
