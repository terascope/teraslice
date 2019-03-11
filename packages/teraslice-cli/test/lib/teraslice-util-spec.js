'use strict';

const path = require('path');

const TerasliceUtil = require('../../lib/teraslice-util');

describe('teraslice-util', () => {
    let cliArgs;
    let testTerasliceUtil;

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(__dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost'
        };
        testTerasliceUtil = new TerasliceUtil(cliArgs);
    });

    afterEach(() => {
        cliArgs = {};
        testTerasliceUtil = {};
    });

    test('should return a config object', () => {
        expect(testTerasliceUtil).toBeDefined();
    });
});
