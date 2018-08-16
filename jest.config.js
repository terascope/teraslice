'use strict';

const base = require('./jest.config.base');

module.exports = Object.assign({}, base, {
    projects: [
        '<rootDir>/packages/*/jest.config.js'
    ],
    collectCoverage: true,
    coverageReporters: ['json', 'lcov', 'text', 'html'],
    coverageDirectory: 'coverage'
});
