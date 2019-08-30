'use strict';

// requiring the eslint patch will cause the tests to fail
if (process.env.NODE_ENV !== 'test') {
    require('./lib/patch-eslint6');
}
const { rules, overrides } = require('./lib');

module.exports = {
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 8,
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
