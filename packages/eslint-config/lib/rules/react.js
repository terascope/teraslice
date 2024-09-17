import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { INDENT } from './constants.js';
import tsRules from './typescript.js';

export default Object.assign({}, tsRules, {
    ...react.configs.flat.recommended.rules,
    ...jsxA11y.flatConfigs.recommended.rules,
    ...reactHooks.configs.recommended.rules,
    // overrides
    'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
    // react rules
    'react/require-default-props': 'off',
    'react/jsx-filename-extension': [2, { extensions: ['.jsx', '.tsx'] }],
    'react/forbid-prop-types': 'off',
    'react/prop-types': [2, { skipUndeclared: true, ignore: ['children'] }],
    'react/no-array-index-key': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-indent': ['error', INDENT],
    'react/jsx-indent-props': ['error', INDENT],
    'react/jsx-props-no-spreading': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    // This rule triggers incorrectly on other non react files
    'react/no-is-mounted': 'off'
});
