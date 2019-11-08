'use strict';

const ms = require('ms');
const _ = require('lodash');
const Promise = require('bluebird');
const signale = require('./signale');
const misc = require('./misc');
const wait = require('./wait');

const { cluster, executions } = misc.teraslice();

async function resetState() {
    const startTime = Date.now();
    const state = await cluster.state();

    await Promise.all([
        Promise.delay(800),
        misc.cleanupIndex(`${misc.SPEC_INDEX_PREFIX}*`),
        (async () => {
            const cleanupExIds = [];
            _.forEach(state, (node) => {
                const { assignment, ex_id: exId } = node;

                const isWorker = ['execution_controller', 'worker'].includes(assignment);
                if (isWorker) {
                    cleanupExIds.push(exId);
                }
            });

            await Promise.all(
                _.uniq(cleanupExIds).map(async (exId) => {
                    signale.warn(`resetting ex ${exId}`);
                    try {
                        await executions.wrap(exId).stop({ blocking: true });
                    } catch (err) {
                        // ignore error;
                    }
                })
            );
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
        signale.warn(`resetting took ${ms(elapsed)}`);
    }
}

async function submitAndStart(jobSpec, delay) {
    if (delay) {
        misc.injectDelay(jobSpec, delay);
    }

    const ex = await executions.submit(jobSpec);
    await wait.waitForExStatus(ex, 'running');
    return ex;
}

async function runEsJob(jobSpec, index, delay) {
    if (delay) {
        misc.injectDelay(jobSpec, delay);
    }

    const ex = await executions.submit(jobSpec);
    await wait.waitForExStatus(ex, 'completed');

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
    const ex = await submitAndStart(jobSpec, delay);

    const waitForStatus = (status) => wait.waitForExStatus(ex, status, 50, 0);

    let p = waitForStatus('paused');
    ex.pause();
    await p;

    p = waitForStatus('running');
    ex.resume();
    await p;

    p = waitForStatus('stopped');
    ex.stop();

    try {
        await p;
    } catch (err) {
        const alreadyCompletedErr = 'cannot reach the target status, "stopped", because it is in the terminal state, "completed"';
        const errStr = _.toString(err);
        if (errStr.includes(alreadyCompletedErr)) {
            signale.warn(
                `${errStr} - however since this can be race condition, we don't want to fail the test`
            );
            return ex;
        }

        throw err;
    }

    await ex.recover();
    await waitForStatus('completed');

    return ex;
}

module.exports = {
    resetState,
    submitAndStart,
    runEsJob,
    testJobLifeCycle
};
