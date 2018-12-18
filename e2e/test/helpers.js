'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const misc = require('./misc');
const wait = require('./wait');

const { cluster, jobs } = misc.teraslice();

async function resetState() {
    const state = await cluster.state();

    await Promise.all([
        (async () => {
            const cleanupJobs = [];
            _.forEach(state, (node) => {
                const { assignment, job_id: jobId } = node;

                const isWorker = ['execution_controller', 'worker'].includes(assignment);
                if (isWorker) {
                    cleanupJobs.push(jobId);
                }
            });

            await Promise.map(_.uniq(cleanupJobs), async (jobId) => {
                try {
                    await jobs.wrap(jobId).stop({ blocking: true });
                } catch (err) {
                    // ignore error;
                }
            });
        })(),
        (async () => {
            const count = _.keys(state).length;
            if (count !== misc.DEFAULT_NODES) {
                await misc.scaleWorkers();
                await wait.forWorkers();
            }
        })()
    ]);
}

async function submitAndStart(jobSpec, delay) {
    if (delay) {
        misc.injectDelay(jobSpec, delay);
    }

    const job = await jobs.submit(jobSpec);
    await wait.waitForJobStatus(job, 'running');
    return job;
}

async function runEsJob(jobSpec, index) {
    const job = await jobs.submit(jobSpec);
    await wait.waitForJobStatus(job, 'completed');

    try {
        const stats = await misc.indexStats(index);
        return stats.count;
    } catch (err) {
        throw new Error(`Unable to get stats for index ${index}`);
    }
}

/**
 * Test pause
*/
async function testJobLifeCycle(jobSpec, delay = 3000) {
    const job = await submitAndStart(jobSpec, delay);

    const waitForStatus = status => wait.waitForJobStatus(job, status, 50, 0);

    let p = waitForStatus('paused');
    job.pause();
    await p;

    p = waitForStatus('running');
    job.resume();
    await p;

    job.stop();
    p = waitForStatus('stopped');
    await p;

    await job.recover();
    await waitForStatus('completed');

    return job;
}

module.exports = {
    resetState,
    submitAndStart,
    runEsJob,
    testJobLifeCycle,
};
