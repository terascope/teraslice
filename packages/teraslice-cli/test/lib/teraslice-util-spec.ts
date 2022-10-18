import path from 'path';
import TerasliceUtil from '../../src/helpers/teraslice-util.js';

describe('teraslice-util', () => {
    let cliArgs;
    let testTerasliceUtil: any;

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
