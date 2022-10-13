import { INDENT } from './constants';
import tsRules from './typescript';

export default Object.assign({}, tsRules, {
    // overides
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
    'jsx-a11y/label-has-associated-control': 'off'
});
