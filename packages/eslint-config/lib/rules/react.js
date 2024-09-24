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
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
    'react/forbid-prop-types': 'off',
    'react/prop-types': ['error', { skipUndeclared: true, ignore: ['children'] }],
    'react/no-array-index-key': 'off',
    'react/destructuring-assignment': 'off',
    'react/jsx-indent': ['error', INDENT],
    'react/jsx-indent-props': ['error', INDENT],
    'react/jsx-props-no-spreading': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    // This rule triggers incorrectly on other non react files
    'react/no-is-mounted': 'off',
    'react/button-has-type': 'error',
    'react/checked-requires-onchange-or-readonly': [
        'warn',
        {
            ignoreMissingProperties: true,
            ignoreExclusiveCheckedAttribute: true
        }
    ],
    'react/forbid-component-props': 'error',
    'react/forbid-dom-props': 'off',
    'react/function-component-definition': 'error',
    'react/hook-use-state': ['error', { allowDestructuredState: true }],
    'react/jsx-child-element-spacing': 'error',
    'react/jsx-fragments': ['error', 'syntax'],
    'react/jsx-boolean-value': 'warn',
    'react/jsx-no-bind': ['warn', { allowArrowFunctions: true, allowFunctions: true }],
    'react/jsx-no-constructed-context-values': 'warn',
    'react/jsx-no-leaked-render': 'warn',
    'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
    'react/no-access-state-in-setstate': 'error',
    'react/no-arrow-function-lifecycle': 'error',
    'react/no-danger': 'warn',
    'react/no-invalid-html-attribute': 'warn',
    'react/no-namespace': 'warn',
    'react/no-object-type-as-default-prop': 'error',
    'react/no-this-in-sfc': 'error',
});
