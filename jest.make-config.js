import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCI } from '@terascope/core-utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default (projectDirs, _coverageDir) => {
    let rootDir;
    const displayName = '';
    const parentFolders = new Set();

    const runInDir = process.cwd() !== dirname;

    const projDirsWithPkgRoots = projectDirs.map(
        (projectDir) => {
            const name = path.basename(projectDir);
            if (name === 'e2e') {
                parentFolders.add(name);
                if (runInDir) {
                    rootDir = './';
                    return [projectDir, '<rootDir>'];
                } else {
                    rootDir = '../';
                    return [projectDir, `<rootDir>${name}`];
                }
            }
            parentFolders.add('packages');
            rootDir = import.meta.dirname;
            if (!rootDir.endsWith('/')) rootDir += '/';
            return [projectDir, `<rootDir>packages/${name}`];
        });

    const coverageReporters = ['lcov'];

    if (!isCI) {
        coverageReporters.push('text-summary');
    }

    console.error('===conf-projDirsWithPkgRoots', projDirsWithPkgRoots);

    const config = {
        rootDir,
        displayName,
        testEnvironment: 'node',
        testTimeout: 60 * 1000,
        setupFilesAfterEnv: ['jest-extended/all'],
        testMatch: projDirsWithPkgRoots.flatMap(
            ([_, packageRoot]) => [
                `${packageRoot}/test/**/*-spec.{ts,js}`,
                `${packageRoot}/test/*-spec.{ts,js}`
            ]
        ),
        testPathIgnorePatterns: [...parentFolders].flatMap(
            (parentFolder) => [
                `<rootDir>${parentFolder}/*/node_modules`,
                `<rootDir>${parentFolder}/*/dist`,
                `<rootDir>${parentFolder}/teraslice-cli/test/fixtures/`
            ]
        ).concat(['<rootDir>assets']),
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
        // running locally multiple projects at a time w/individual jest configs
        // the coverage doesn't go to each package - all goes to 1 of the packages,
        // so in CI we were just running 1 package at a time due to an old issue in jest,
        coverageDirectory: 'coverage',
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
        roots: projDirsWithPkgRoots.map(([_, packageRoot]) => `${packageRoot}/test`),
        collectCoverage: true,
        coverageReporters: coverageReporters
    };

    projDirsWithPkgRoots.forEach(([projectDir, packageRoot]) => {
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
            config.setupFilesAfterEnv ??= [];
            config.setupFilesAfterEnv.push(`${packageRoot}/test/test.setup.js`);
        }

        if (fs.existsSync(path.join(projectDir, 'lib'))) {
            config.roots ??= [];
            config.roots.push(`${packageRoot}/lib`);
        } else if (fs.existsSync(path.join(projectDir, 'index.js'))) {
            config.roots ??= [];
            config.roots.push(`${packageRoot}`);
        }

        if (fs.existsSync(path.join(projectDir, 'src'))) {
            config.roots ??= [];
            config.roots.push(`${packageRoot}/src`);
        }

        if (fs.existsSync(path.join(projectDir, 'peg'))) {
            config.roots ??= [];
            config.roots.push(`${packageRoot}/peg`);
        }
    });

    return config;
};
