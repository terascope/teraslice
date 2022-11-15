import TjmUtil from '../../src/helpers/tjm-util.js';

let startResponse: any;
let stopResponse: any;
let statusResponse: any;
let waitStatus: any;
let job: any = {};

const client: any = {
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
        job.id = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        startResponse = { job_id: 'testJobId' };

        const tjmUtil = new TjmUtil(client, job);

        const response = await tjmUtil.start();

        // no errors should return nothing
        expect(response).toBeUndefined();
    });

    it('should throw an error if job id missing from response', async () => {
        job.id = 'testJobId';
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
        job.id = 'testJobId';
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
        job.id = 'testJobId';
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
        job.id = 'testJobId';
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
        expect.hasAssertions();

        job.id = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';
        statusResponse = 'running';
        stopResponse = { status: 'running' };

        const tjmUtil = new TjmUtil(client, job);
        try {
            await tjmUtil.stop();
        } catch (e) {
            expect(e.message).toBe('Could not stop job testJobName on testCluster, current job status is running');
        }
    });

    it('should stop the job again if status is stopping', async () => {
        job.id = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';
        statusResponse = 'stopping';
        stopResponse = { status: 'stopped' };

        const tjmUtil = new TjmUtil(client, job);
        const response = await tjmUtil.stop();
        // no errors should return nothing
        expect(response).toBeUndefined();
    });

    it('should not throw a fatal error if job has a terminal status', async () => {
        job.id = 'testJobId';
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
        job.id = 'testJobId';
        job.name = 'testJobName';
        job.clusterUrl = 'testCluster';

        statusResponse = 'running';
        stopResponse = Promise.reject(new Error('this is a terrible error'));

        const tjmUtil = new TjmUtil(client, job);

        try {
            await tjmUtil.stop();
        } catch (e) {
            expect(e.message).toBe('this is a terrible error');
        }
    });
});
