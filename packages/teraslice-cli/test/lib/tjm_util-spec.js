'use strict';

const Promise = require('bluebird');
const TjmUtil = require('../../lib/tjm-util');

let startResponse = null;
let stopResponse = null;
let statusResponse = null;
let waitStatus = null;
let job = {};

const client = {
    jobs: {
        wrap: () => {
            const functions = {
                start: () => startResponse,
                stop: () => stopResponse,
                status: () => statusResponse,
                waitForStatus: () => waitStatus
            };
            return functions;
        }
    }
};

describe('tjm-util start function', () => {
    beforeEach(() => {
        startResponse = null;
        job = {};
    });

    it('should return nothing if no errors', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        startResponse = { job_id: 'testJobId' };

        const tjmUtil = new TjmUtil(client, job);
        const response = await tjmUtil.start();
        // no errors should return nothing
        expect(response).toBeUndefined();
    });

    it('should throw an error if job id missing from response', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';
        startResponse = {};

        const tjmUtil = new TjmUtil(client, job);
        try {
            await tjmUtil.start();
        } catch (e) {
            expect(e.message).toBe('Could not start testJobName on testCluster');
        }
    });

    it('should throw an error if job ids do not match', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName2';
        job.clusterUrl = 'testCluster2';
        startResponse = { job_id: 'badJobId' };

        const tjmUtil = new TjmUtil(client, job);
        try {
            await tjmUtil.start();
        } catch (e) {
            expect(e.message).toBe('Could not start testJobName2 on testCluster2');
        }
    });

    it('should throw an error if client returns an error', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        startResponse = Promise.reject(new Error('this is a terrible error'));

        const tjmUtil = new TjmUtil(client, job);
        try {
            await tjmUtil.start();
        } catch (e) {
            expect(e.message).toBe('this is a terrible error');
        }
    });
});

describe('tjm-util stop function', () => {
    beforeEach(() => {
        stopResponse = null;
        job = {};
    });

    it('should return nothing if no errors', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        statusResponse = 'running';

        stopResponse = { status: 'stopped' };

        const tjmUtil = new TjmUtil(client, job);
        const response = await tjmUtil.stop();
        // no errors should return nothing
        expect(response).toBeUndefined();
    });

    it('should throw an error if the status is not stopped', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';
        statusResponse = 'running';
        stopResponse = { status: 'running' };

        const tjmUtil = new TjmUtil(client, job);
        try {
            await tjmUtil.stop();
        } catch (e) {
            expect(e.message).toBe('Error: Could not stop testJobName on testCluster');
        }
    });

    it('should wait for job to stop if status is stopping', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';
        statusResponse = 'stopping';
        waitStatus = 'stopped';

        const tjmUtil = new TjmUtil(client, job);
        const response = await tjmUtil.stop();
        // no errors should return nothing
        expect(response).toBeUndefined();
    });

    it('should not throw a fatal error if job has a terminal status', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        statusResponse = 'failed';

        let tjmUtil = new TjmUtil(client, job);

        const response = await tjmUtil.stop();
        expect(response).toBeUndefined();

        statusResponse = 'stopped';
        tjmUtil = new TjmUtil(client, job);

        const response2 = await tjmUtil.stop();
        expect(response2).toBeUndefined();

        statusResponse = 'terminated';
        tjmUtil = new TjmUtil(client, job);

        const response3 = await tjmUtil.stop();
        expect(response3).toBeUndefined();
    });

    it('should throw a fatal error if error not listed', async () => {
        job.jobId = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        statusResponse = 'running';
        stopResponse = Promise.reject(new Error('this is a terrible error'));

        const tjmUtil = new TjmUtil(client, job);

        try {
            await tjmUtil.stop();
        } catch (e) {
            expect(e.message).toBe('Error: this is a terrible error');
        }
    });
});
