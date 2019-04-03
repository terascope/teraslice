'use strict';

const path = require('path');
const fs = require('fs-extra');
const { jest: lernaAliases } = require('lerna-alias');

module.exports = (projectDir) => {
    const name = path.basename(projectDir);
    const workspaceName = name === 'e2e' ? 'e2e' : 'packages';
    const rootDir = name === 'e2e' ? '../' : '../../';
    const projectRoot = name === 'e2e' ? '<rootDir>/e2e' : `<rootDir>/${workspaceName}/${name}`;
    const isTypescript = fs.pathExistsSync(path.join(projectDir, 'tsconfig.json'));
    const runInPackage = projectDir === process.cwd();

    const config = {
        rootDir,
        name: `${workspaceName}/${name}`,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended'],
        testMatch: [
            `${projectRoot}/test/**/*-spec.{ts,js}`,
            `${projectRoot}/test/*-spec.{ts,js}`
        ],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${workspaceName}/*/node_modules`,
            `<rootDir>/${workspaceName}/*/dist`,
            `<rootDir>/${workspaceName}/teraslice-cli/test/fixtures/`,
        ],
        moduleNameMapper: lernaAliases({ mainFields: ['srcMain', 'main'] }),
        moduleFileExtensions: [
            'ts',
            'js',
            'json',
            'node'
        ],
        collectCoverage: true,
        coveragePathIgnorePatterns: [
            '/node_modules/',
            '/test/',
        ],
        coverageReporters: runInPackage ? ['html'] : ['lcov', 'text', 'html'],
        coverageDirectory: `${projectRoot}/coverage`,
        preset: 'ts-jest'
    };

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${projectRoot}/test/global.setup.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${projectRoot}/test/global.teardown.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupFilesAfterEnv.push(`${projectRoot}/test/test.setup.js`);
    }

    config.globals = {
        availableExtensions: ['.js', '.ts']
    };

    if (isTypescript) {
        if (runInPackage) {
            config.globals['ts-jest'] = {
                tsConfig: './tsconfig.json',
                diagnostics: true,
                pretty: true,
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

    config.roots = [
        `${projectRoot}/test`
    ];

    if (fs.pathExistsSync(path.join(projectDir, 'lib'))) {
        config.roots.push(`${projectRoot}/lib`);
    } else if (fs.pathExistsSync(path.join(projectDir, 'index.js'))) {
        config.roots.push(`${projectRoot}`);
    }

    if (fs.pathExistsSync(path.join(projectDir, 'src'))) {
        config.roots.push(`${projectRoot}/src`);
    }

    return config;
};
