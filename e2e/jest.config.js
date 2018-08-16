'use strict';

const base = require('../jest.config.base');
const { name } = require('./package.json');

module.exports = Object.assign({}, base, {
    name,
    displayName: name,
    globalSetup: '<rootDir>/test/global.setup.js',
    globalTeardown: '<rootDir>/test/global.teardown.js',
    setupTestFrameworkScriptFile: '<rootDir>/test/test.setup.js',
    collectCoverage: false,
});
