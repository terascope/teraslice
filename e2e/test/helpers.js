import ms from 'ms';
import { pDelay, uniq, toString } from '@terascope/utils';
import signale from './signale.js';
import misc from './misc.js';
import wait from './wait.js';

const { cluster, executions } = misc.teraslice();

export async function resetState() {
    const startTime = Date.now();
    const state = await cluster.state();

    await Promise.all([
        pDelay(800),
        misc.cleanupIndex(`${misc.SPEC_INDEX_PREFIX}*`),
        (async () => {
            const cleanupExIds = [];
            Object.values(state).forEach((node) => {
                const { assignment, ex_id: exId } = node;

                const isWorker = ['execution_controller', 'worker'].includes(assignment);
                if (isWorker) {
                    cleanupExIds.push(exId);
                }
            });

            await Promise.all(
                uniq(cleanupExIds).map(async (exId) => {
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
            const count = Object.keys(state).length;
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

export async function submitAndStart(jobSpec, delay) {
    if (delay) {
        misc.injectDelay(jobSpec, delay);
    }

    const ex = await executions.submit(jobSpec);
    await wait.waitForExStatus(ex, 'running');
    return ex;
}

export async function runEsJob(jobSpec, index, delay) {
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
export async function testJobLifeCycle(jobSpec, delay = 3000) {
    let ex;
    const waitForStatus = async (status) => wait.waitForExStatus(ex, status, 50, 0);

    if (delay) {
        misc.injectDelay(jobSpec, delay);
    }

    ex = await executions.submit(jobSpec);
    await waitForStatus('running');

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
        const errStr = toString(err);
        if (errStr.includes('"stopped"') && errStr.includes('"completed"')) {
            signale.warn(
                `${errStr} - however since this can be race condition, we don't want to fail the test`
            );
            return ex;
        }

        throw err;
    }

    ex = await ex.recover();
    await waitForStatus('completed');
    return ex;
}
