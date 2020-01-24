import path from 'path';
import nock from 'nock';

import Jobs from '../../src/helpers/jobs';

describe('jobs', () => {
    const id = '12341234';
    const exId = '56785678';
    let jobs: any;
    let cliArgs = {
        'cluster-manager-type': 'native',
        'output-style': 'txt',
        'config-dir': path.join(__dirname, '../fixtures/config_dir'),
        'cluster-alias': 'localhost',
        args: {}
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let scope: nock.Scope;
    let msg: any;

    beforeEach(() => {
        cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(__dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost',
            args: {}
        };

        scope = nock('http://localhost:5678');
    });

    afterEach(() => {
        jobs = {};
        nock.cleanAll();
    });

    it('should return a job object', () => {
        const number = 5;
        const action = 'add';

        cliArgs.args = { id, action, number };

        jobs = new Jobs(cliArgs);
        expect(jobs).toBeDefined();
    });

    it('workers function should return ts client response if an object', async () => {
        const number = 5;
        const action = 'add';

        cliArgs.args = { id, action, number };

        jobs = new Jobs(cliArgs);

        msg = { message: `5 workers have been added for execution: ${exId}` };

        scope
            .post(`/v1/jobs/${id}/_workers?add=5`)
            .reply(200, msg);

        const results = await jobs.workers();
        expect(results).toEqual(`${msg.message}`);
    });

    it('workers function should return ts client response if a string', async () => {
        const number = 3;
        const action = 'remove';

        cliArgs.args = { id, action, number };

        jobs = new Jobs(cliArgs);

        msg = `3 workers have been removed for execution: ${exId}`;

        scope
            .post(`/v1/jobs/${id}/_workers?remove=3`)
            .reply(200, msg);

        const results = await jobs.workers();
        expect(results).toEqual(`${msg}`);
    });
});
