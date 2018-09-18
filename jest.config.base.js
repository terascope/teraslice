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

    const config = {
        rootDir,
        name: `${workspaceName}/${name}`,
        displayName: name,
        verbose: true,
        testEnvironment: 'node',
        transform: {
            '^.+\\.ts$': 'ts-jest'
        },
        setupTestFrameworkScriptFile: 'jest-extended',
        testMatch: [
            `${projectRoot}/test/**/*-spec.{ts,js}`,
            `${projectRoot}/test/*-spec.{ts,js}`
        ],
        testPathIgnorePatterns: [
            '<rootDir>/assets',
            `<rootDir>/${workspaceName}/*/node_modules`,
            `<rootDir>/${workspaceName}/*/dist`,
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
        coverageReporters: ['lcov', 'text', 'html'],
        coverageDirectory: `${projectRoot}/coverage`
    };

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.setup.js'))) {
        config.globalSetup = `${projectRoot}/test/global.setup.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/global.teardown.js'))) {
        config.globalTeardown = `${projectRoot}/test/global.teardown.js`;
    }

    if (fs.pathExistsSync(path.join(projectDir, 'test/test.setup.js'))) {
        config.setupTestFrameworkScriptFile = `${projectRoot}/test/test.setup.js`;
    }

    if (isTypescript) {
        config.globals = {
            'ts-jest': {
                tsConfigFile: `./${workspaceName}/${name}/tsconfig.json`,
                enableTsDiagnostics: true
            }
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
