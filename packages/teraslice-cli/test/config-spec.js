'use strict';

const { createTempDirSync } = require('jest-fixtures');
const config = require('../cmds/lib/config')();

const tmpDir = createTempDirSync();

describe('_urlCheck', () => {
    it('full url should be passed unchanged', () => {
        const testUrl = 'http://test1.net:80';
        const result = config._urlCheck(testUrl);
        expect(result).toBe(testUrl);
    });
    it('host only should prepended by http://', () => {
        const testUrl = 'test1.net:80';
        const result = config._urlCheck(testUrl);
        expect(result).toBe(`http://${testUrl}`);
    });
    it('host only without port should be prepended with http:// and port should be 5678', () => {
        const testUrl = 'test1.net';
        const result = config._urlCheck(testUrl);
        expect(result).toBe(`http://${testUrl}:5678`);
    });

    it('fails with empty url', () => {
        function urlCheck() {
            config._urlCheck('');
        }
        expect(urlCheck).toThrow('empty url');
    });
});

describe('getClusterHost', () => {
    it('full url should be returned given cluster alias', () => {
        const configVar = {};
        const defaultConfigData = {
            clusters:
                { localhost: { host: 'http://localhost:5678', cluster_manager_type: 'native' } },
            paths: { job_state_dir: `${tmpDir}/job_state_files` }
        };
        configVar.config = defaultConfigData;
        configVar.cluster = 'localhost';
        const result = config.getClusterHost(configVar);
        expect(result).toBe('http://localhost:5678');
    });
});
