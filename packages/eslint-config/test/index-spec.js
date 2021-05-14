'use strict';

require('jest-extended');
const Index = require('..');

describe('ESLint Config Index', () => {
    it('should export an object of rules', () => {
        expect(Index).toHaveProperty('rules');
        expect(Index.rules).toBeObject();
    });

    it('should export js parserOptions by default', () => {
        expect(Index).toHaveProperty('parserOptions');
        expect(Index.parserOptions).toMatchObject({
            ecmaVersion: 2020,
            sourceType: 'script',
        },);
    });

    it('should export an array of configs to extends with airbnb-base', () => {
        expect(Index).toHaveProperty('extends');
        expect(Index.extends).toBeArray();
        expect(Index.extends).toContain('airbnb-base');
    });

    it('should export a list overrides with typescript and react support', () => {
        expect(Index).toHaveProperty('overrides');
        expect(Index.overrides).toBeArray();
        expect(Index.overrides[1]).toMatchObject({
            files: ['*.jsx', '*.tsx'],
            extends: ['plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended', 'airbnb'],
            parser: '@typescript-eslint/parser',
            env: {
                jest: true,
                jasmine: false,
                node: false,
                browser: true,
            },
            parserOptions: {
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                    jsx: true,
                },
                useJSXTextNode: true,
            },
        });

        expect(Index.overrides[2]).toMatchObject({
            files: ['*.ts'],
            extends: ['plugin:@typescript-eslint/recommended', 'airbnb-base'],
            plugins: ['@typescript-eslint'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                    jsx: false,
                },
            },
        });
    });

    it('should export an env with at least node and jest', () => {
        expect(Index).toHaveProperty('env');
        expect(Index.env).toBeObject();
        expect(Index.env).toMatchObject({
            jest: true,
            node: true
        });
    });
});
