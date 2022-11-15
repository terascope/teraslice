import { rules, overrides } from './lib.js';

export default {
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    env: {
        node: true,
        jasmine: true,
        jest: true,
    },
    rules: rules.javascript,
    overrides,
};
