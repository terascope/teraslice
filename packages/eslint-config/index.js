'use strict';

const { rules, overrides } = require('./lib');

module.exports = {
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'script',
    },
    env: {
        node: true,
        jasmine: true,
        jest: true,
    },
    rules: rules.javascript,
    overrides,
};
