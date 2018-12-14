'use strict';

const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('generator:package', () => {
    describe('when using typescript', () => {
        beforeAll(() => helpers
            .run(path.join(__dirname, '../generators/package'))
            .withPrompts({
                name: 'hello',
                internal: true,
                description: 'Hello there',
                typescript: true
            }));

        it('should create the files', () => {
            assert.file([
                'README.md',
                'package.json',
                'LICENSE',
                'jest.config.js',
                'src/example.ts',
                'src/index.ts',
                'test/example-spec.ts',
                'test/index-spec.ts',
                'tsconfig.build.json',
                'tsconfig.json',
            ]);
        });
    });

    describe('when using javascript', () => {
        beforeAll(() => helpers
            .run(path.join(__dirname, '../generators/package'))
            .withPrompts({
                name: 'hello',
                internal: false,
                description: 'Hello there',
                typescript: false
            }));

        it('should create the files', () => {
            assert.file([
                'README.md',
                'package.json',
                'LICENSE',
                'jest.config.js',
                'lib/example.js',
                'lib/index.js',
                'test/example-spec.js',
                'test/index-spec.js'
            ]);
        });
    });
});
