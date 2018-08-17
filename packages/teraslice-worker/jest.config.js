'use strict';

const base = require('../../jest.config.base');
const { name } = require('./package.json');

module.exports = Object.assign({}, base, {
    name,
    displayName: name,
    globalSetup: '<rootDir>/test/global.setup.js',
    globalTeardown: '<rootDir>/test/global.teardown.js',
    setupTestFrameworkScriptFile: '<rootDir>/test/test.setup.js',
    coveragePathIgnorePatterns: [
        ...base.coveragePathIgnorePatterns,
        '<rootDir>/lib/teraslice',
        '<rootDir>/lib/terafoundation',
        '<rootDir>/test/env-setup.js'
    ],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80
        }
    }
});
