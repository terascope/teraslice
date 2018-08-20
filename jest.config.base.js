'use strict';

const path = require('path');
const fs = require('fs-extra');

module.exports = (projectDir) => {
    const name = path.basename(projectDir);
    const isTypescript = fs.pathExistsSync(path.join(projectDir, 'tsconfig.json'));
    const projectRoot = `<rootDir>/packages/${name}`;

    const config = {
        name,
        displayName: name,
        rootDir: '../../',
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
            '<rootDir>/packages/*/node_modules',
            '<rootDir>/packages/*/dist',
        ],
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
        coverageDirectory: 'coverage'
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
                tsConfigFile: `./packages/${name}/tsconfig.json`,
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
