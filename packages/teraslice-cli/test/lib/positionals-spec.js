'use strict';

const Positionals = require('../../lib/yargs/positionals');

describe('positionals', () => {
    let positionals;

    beforeEach(() => {
        positionals = new Positionals();
    });

    afterEach(() => {
        positionals = null;
    });

    test('should return a defined object', () => {
        expect(positionals).toBeDefined();
    });

    test('should build an option', () => {
        positionals.positionals = {
            config: () => ({
                alias: 'conf',
                describe: 'Config file',
                default: 'test.json'
            }),
        };
        expect(positionals.build('config').alias).toBe('conf');
    });
});
