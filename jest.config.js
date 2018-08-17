'use strict';

const base = require('./jest.config.base');

module.exports = Object.assign({}, base, {
    projects: [
        '<rootDir>/packages/*'
    ],
    collectCoverage: true,
    coverageReporters: ['lcov', 'text', 'html'],
    coverageDirectory: 'coverage'
});
