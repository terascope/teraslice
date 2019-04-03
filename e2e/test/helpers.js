'use strict';

const _ = require('lodash');
const signale = require('signale');
const Promise = require('bluebird');
const misc = require('./misc');
const wait = require('./wait');

const { cluster, jobs } = misc.teraslice();

async function resetState() {
    const startTime = Date.now();
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
                signale.warn(`resetting job ${jobId}`);
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
                signale.warn(`resetting cluster state of ${count} nodes`);
                await misc.scaleWorkers();
                await wait.forWorkers();
            }
        })()
    ]);

    const elapsed = Date.now() - startTime;
    if (elapsed > 1000) {
        signale.warn(`resetting took ${elapsed}ms`);
    }
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

    p = waitForStatus('stopped');
    job.stop();

    try {
        await p;
    } catch (err) {
        const alreadyCompletedErr = 'Job cannot reach the target status, "stopped", because it is in the terminal state, "completed"';
        const errStr = _.toString(err);
        if (errStr.includes(alreadyCompletedErr)) {
            signale.warn(`${errStr} - however since this can be race condition, we don't want to fail the test`);
            return job;
        }

        throw err;
    }

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
