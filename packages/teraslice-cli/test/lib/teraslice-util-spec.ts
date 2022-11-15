import path from 'path';
import { fileURLToPath } from 'url';
import TerasliceUtil from '../../src/helpers/teraslice-util.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

describe('teraslice-util', () => {
    let cliArgs;
    let testTerasliceUtil: any;

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(dirPath, '../fixtures/config_dir'),
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
