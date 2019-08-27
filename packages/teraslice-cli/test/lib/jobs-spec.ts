
import path from 'path';
import Jobs from '../../src/helpers/jobs';

describe('jobs', () => {
    let cliArgs;
    let jobs:any;

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(__dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost'
        };
        jobs = new Jobs(cliArgs);
    });

    afterEach(() => {
        cliArgs = {};
        jobs = {};
    });

    test('should return a job object', () => {
        expect(jobs).toBeDefined();
    });
});
