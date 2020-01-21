import path from 'path';
import nock from 'nock';

import Jobs from '../../src/helpers/jobs';

describe('jobs', () => {
    const id = '12341234';
    const exId = '56785678';
    const num = 5;
    const action = 'add';
    let cliArgs;
    let jobs: any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let scope: nock.Scope;

    const msg = { message: `${num} workers have been ${action} for execution: ${exId}` };

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(__dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost',
            args: { id, action, num }
        };

        scope = nock('http://localhost:5678')
            .post(`/v1/jobs/${id}/_workers?add=5`)
            .reply(200, msg);

        jobs = new Jobs(cliArgs);
    });

    afterEach(() => {
        cliArgs = {};
        jobs = {};
        nock.cleanAll();
    });

    it('should return a job object', () => {
        expect(jobs).toBeDefined();
    });

    it('can log properly', async () => {
        const results = await jobs.workers();
        expect(results).toEqual(`> job: ${id} ${msg.message}`);
    });
});
