import jest from 'eslint-plugin-jest';
import jestDOM from 'eslint-plugin-jest-dom';

export default {
    ...jest.configs['flat/recommended'].rules,
    ...jestDOM.configs['flat/recommended'].rules,
    'jest/no-commented-out-tests': 'warn',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'warn',
    'jest/no-identical-title': 'warn',
    'jest/no-jasmine-globals': 'error',
    'jest/no-standalone-expect': 'error',
    'jest/prefer-to-contain': 'warn',
    'jest/prefer-todo': 'warn',
    'jest/require-top-level-describe': 'warn',
    'jest/valid-describe-callback': 'error',
    'jest/valid-expect-in-promise': 'error',
    'jest/valid-expect': 'error',
    'jest/valid-title': 'error',
    // TODO: we probably want to put both of these back on
    'jest/no-conditional-expect': 'off',
    'jest/no-alias-methods': 'off'
};
