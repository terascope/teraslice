import path from 'path';
import nock from 'nock';

import Jobs from '../../src/helpers/jobs.js';

describe('jobs', () => {
    const id = '12341234';

    const cliArgs = {
        'cluster-manager-type': 'native',
        'output-style': 'txt',
        'config-dir': path.join(__dirname, '../fixtures/config_dir'),
        'cluster-alias': 'localhost',
        args: {}
    };

    it('should return a job object', () => {
        const number = 5;
        const action = 'add';

        cliArgs.args = { id, action, number };

        const jobs = new Jobs(cliArgs);
        expect(jobs).toBeDefined();
    });
});

describe('jobs.workers should', () => {
    let msg: any;
    let jobs: any;
    const id = '12341234';
    const exId = '56785678';

    const scope = nock('http://localhost:5678');

    const cliArgs = {
        'cluster-manager-type': 'native',
        'output-style': 'txt',
        'config-dir': path.join(__dirname, '../fixtures/config_dir'),
        'cluster-alias': 'localhost',
        args: {}
    };

    beforeEach(() => {
        cliArgs.args = {};
    });

    afterEach(() => {
        jobs = {};
        nock.cleanAll();
    });

    it('return correct response if ts-client response is an object', async () => {
        cliArgs.args = { id, action: 'add', number: 5 };

        jobs = new Jobs(cliArgs);

        msg = { message: `5 workers have been added for execution: ${exId}` };

        scope
            .post(`/v1/jobs/${id}/_workers?add=5`)
            .reply(200, msg);

        const results = await jobs.workers();
        expect(results).toEqual(`${msg.message}`);
    });

    it('return correct response if ts-client response is a string', async () => {
        cliArgs.args = { id, action: 'remove', number: 3 };

        jobs = new Jobs(cliArgs);

        msg = `3 workers have been removed for execution: ${exId}`;

        scope
            .post(`/v1/jobs/${id}/_workers?remove=3`)
            .reply(200, msg);

        const results = await jobs.workers();
        expect(results).toEqual(`${msg}`);
    });
});

describe('jobs.awaitStatus should', () => {
    let job: any;
    const id = '12341234';
    const scope = nock('http://localhost:5678');

    const cliArgs = {
        'cluster-manager-type': 'native',
        'output-style': 'txt',
        'config-dir': path.join(__dirname, '../fixtures/config_dir'),
        'cluster-alias': 'localhost',
        args: {}
    };

    beforeEach(() => {
        cliArgs.args = {};
    });

    afterEach(() => {
        job = {};
        nock.cleanAll();
    });

    it('return status when desired status is reached', async () => {
        cliArgs.args = { id, status: ['stopped', 'completed'], timeout: 0 };

        job = new Jobs(cliArgs);

        scope
            .get('/v1/jobs/12341234/ex')
            .reply(200, {
                ex_id: '12341234',
                _status: 'running'
            })
            .get('/v1/jobs/12341234/ex')
            .reply(200, {
                ex_id: '12341234',
                _status: 'stopped'
            });

        const results = await job.awaitStatus();
        expect(results).toEqual('stopped');
    }, 7000);
});
