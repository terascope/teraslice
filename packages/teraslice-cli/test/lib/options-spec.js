'use strict';

const Options = require('../../lib/options');

describe('options', () => {
    let options;

    beforeEach(() => {
        options = new Options();
    });

    afterEach(() => {
        options = null;
    });

    test('should return a defined object', () => {
        expect(options).toBeDefined();
    });

    test('should build an option', () => {
        options.options = {
            config: () => ({
                alias: 'conf',
                describe: 'Config file',
                default: 'test.json'
            }),
        };
        expect(options.build('config').alias).toBe('conf');
    });
});
