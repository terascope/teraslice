import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCI } from '@terascope/core-utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default (projectDirs) => {
    let rootDir;
    const displayName = '';
    const parentFolders = new Set();

    const runInDir = process.cwd() !== dirname;

    const projDirsPkgRootsCovDirs = projectDirs.map(
        (projectDir) => {
            const name = path.basename(projectDir);
            if (name === 'e2e') {
                parentFolders.add(name);
                if (runInDir) {
                    rootDir = './';
                    return [projectDir, '<rootDir>', '<rootDir>coverage'];
                } else {
                    rootDir = '../';
                    return [projectDir, `<rootDir>${name}`, `<rootDir>coverage`];
                }
            }
            parentFolders.add('packages');
            rootDir = import.meta.dirname;
            if (!rootDir.endsWith('/')) rootDir += '/';
            return [projectDir, `<rootDir>packages/${name}`, `<rootDir>coverage/packages/${name}`];
        });

    const coverageReporters = ['lcov'];

    if (!isCI) {
        coverageReporters.push('text-summary');
    }

    const config = {
        rootDir,
        roots: projDirsPkgRootsCovDirs.map((
            [_dir, packageRoot, _cov]) => `${packageRoot}/test`
        ),
        displayName,
        testEnvironment: 'node',
        testTimeout: 60 * 1000,
        setupFilesAfterEnv: ['jest-extended/all'],
        testMatch: projDirsPkgRootsCovDirs.flatMap(
            ([_dir, packageRoot, _cov]) => [
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
        // collect in first package's folder, CI combines them altogether,
        // I tried collecting in a root coverage folder but didn't quite work
        coverageDirectory: projDirsPkgRootsCovDirs[0][2],
        coverageProvider: 'v8',
        collectCoverage: true,
        coverageReporters: coverageReporters,
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
        }
    };

    projDirsPkgRootsCovDirs.forEach(([projectDir, packageRoot, _cov]) => {
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
