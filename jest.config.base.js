'use strict';

const path = require('path');
const fs = require('fs-extra');
const { jest: lernaAliases } = require('lerna-alias');

module.exports = (projectDir) => {
    const name = path.basename(projectDir);
    const workspaceName = name === 'e2e' ? 'e2e' : 'packages';
    const rootDir = name === 'e2e' ? '../' : '../../';
    const packageRoot = name === 'e2e' ? '<rootDir>/e2e' : `<rootDir>/${workspaceName}/${name}`;
    const isTypescript = fs.pathExistsSync(path.join(projectDir, 'tsconfig.json'));
    const runInPackage = projectDir === process.cwd();

    const config = {
        rootDir,
        name: `${workspaceName}/${name}`,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended', '<rootDir>/scripts/add-test-env.js'],
        testMatch: [`${packageRoot}/test/**/*-spec.{ts,js}`, `${packageRoot}/test/*-spec.{ts,js}`],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${workspaceName}/*/node_modules`,
            `<rootDir>/${workspaceName}/*/dist`,
            `<rootDir>/${workspaceName}/teraslice-cli/test/fixtures/`
        ],
        transformIgnorePatterns: ['^.+\\.js$'],
        moduleNameMapper: lernaAliases({ mainFields: ['srcMain', 'main'] }),
        moduleFileExtensions: ['ts', 'js', 'json', 'node', 'pegjs'],
        collectCoverage: true,
        coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
        watchPathIgnorePatterns: [],
        coverageReporters: runInPackage ? ['html'] : ['lcov', 'text', 'html'],
        coverageDirectory: `${packageRoot}/coverage`,
        preset: 'ts-jest',
        watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']
    };

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${packageRoot}/test/global.setup.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${packageRoot}/test/global.teardown.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupFilesAfterEnv.push(`${packageRoot}/test/test.setup.js`);
    }

    config.globals = {
        availableExtensions: ['.js', '.ts']
    };

    if (isTypescript) {
        if (runInPackage) {
            config.globals['ts-jest'] = {
                tsConfig: './tsconfig.json',
                diagnostics: true,
                pretty: true
            };
        } else {
            config.globals['ts-jest'] = {
                tsConfig: `./${workspaceName}/${name}/tsconfig.json`,
                diagnostics: true,
                pretty: true
            };
        }
    } else {
        config.globals['ts-jest'] = {
            diagnostics: true,
            pretty: true
        };
    }

    config.roots = [`${packageRoot}/test`];

    if (fs.pathExistsSync(path.join(projectDir, 'lib'))) {
        config.roots.push(`${packageRoot}/lib`);
    } else if (fs.pathExistsSync(path.join(projectDir, 'index.js'))) {
        config.roots.push(`${packageRoot}`);
    }

    if (fs.pathExistsSync(path.join(projectDir, 'src'))) {
        config.roots.push(`${packageRoot}/src`);
    }

    if (fs.pathExistsSync(path.join(projectDir, 'peg'))) {
        config.watchPathIgnorePatterns.push(`${packageRoot}/peg/*engine*.js`);
        config.roots.push(`${packageRoot}/peg`);
    }

    return config;
};
