'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const signale = require('signale');
const misc = require('./misc');

/*
 * Waits for the promise returned by 'func' to resolve to an array
 * then waits for the length of that array to match 'value'.
 */
function forLength(func, value, iterations) {
    const fn = async () => {
        const result = await func();
        return result.length;
    };

    return forValue(fn, value, iterations);
}

/*
 * Waits for the promise returned by 'func' to resolve to a value
 * that can be compared to 'value'. It will wait 'iterations' of
 * time for the value to match before the returned promise will
 * reject.
 */
function forValue(func, value, iterations = 100) {
    let counter = 0;

    // to keep compatibility since I change delay to 100 from 500
    const _iterations = 100 * 2;

    async function checkValue() {
        counter++;

        const result = await func();
        if (result === value) return Promise.resolve(result);

        if (counter > _iterations) {
            signale.debug('forValue last target value', {
                actual: result,
                expected: value,
                iterations,
                counter
            });

            throw new Error(`forValue didn't find target value after ${iterations} iterations.`);
        }

        await Promise.delay(250);
        return checkValue();
    }

    return checkValue();
}

/*
 * Wait for 'node_count' nodes to be available.
 */
function forNodes(nodeCount = misc.DEFAULT_NODES) {
    const fn = async () => {
        const state = await misc.teraslice().cluster.state();
        return Object.keys(state);
    };

    return forLength(fn, nodeCount);
}

function forWorkers(workerCount = misc.DEFAULT_WORKERS) {
    const fn = async () => {
        const state = await misc.teraslice().cluster.state();
        return Object.keys(state);
    };

    return forLength(fn, workerCount + 1);
}

function scaleWorkersAndWait(workersToAdd = 0) {
    const workerCount = misc.DEFAULT_WORKERS + workersToAdd;
    return misc.scaleWorkers(workersToAdd)
        .then(() => forWorkers(workerCount))
        .then(() => misc.teraslice().cluster.state());
}

/*
 * Wait for 'workerCount' workers to be joined on job 'jobId'.  `iterations`
 * is passed to forValue and indicates how many times the condition will be
 * tested for.
 * TODO: Implement a more generic function that waits for states other than
 * 'joined'
 */
function forWorkersJoined(jobId, workerCount, iterations) {
    const fn = async () => {
        const controllers = await misc.teraslice().cluster.controllers();
        const controller = _.find(controllers, s => s.job_id === jobId);
        if (!controller) return 0;
        return controller.workers_joined;
    };

    return forValue(fn, workerCount, iterations);
}

function waitForClusterState(timeoutMs = 120000) {
    const endAt = Date.now() + timeoutMs;
    const { cluster } = misc.teraslice();
    const requiredNodes = misc.DEFAULT_NODES - 2;

    async function _try() {
        if (Date.now() > endAt) {
            throw new Error(`Failure to communicate with the Cluster Master as ${timeoutMs}ms`);
        }

        let nodes = -1;
        try {
            const result = await cluster.get('/cluster/state', {
                timeout: 500,
                json: true,
            });
            nodes = _.size(_.keys(result));
        } catch (err) {
            return _try();
        }

        if (nodes >= requiredNodes) return nodes;
        return _try();
    }

    return _try();
}

async function waitForJobStatus(job, status, interval = 100, endDelay = 50) {
    const jobId = job._jobId;
    const start = Date.now();

    async function logExErrors() {
        try {
            const errors = await job.errors();
            signale.debug(`waitForStatus: ${jobId} errors`, printObj(errors));
            return null;
        } catch (err) {
            return null;
        }
    }

    function printObj(obj) {
        if (_.isEmpty(obj)) return 'none';
        return JSON.stringify(obj);
    }

    async function logExStatus(lastStatus) {
        try {
            const exStatus = await job.get(`/jobs/${jobId}/ex`);
            if (_.isEmpty(exStatus)) return null;

            const reasons = _.pick(exStatus, [
                '_failureReason',
                '_hasErrors'
            ]);

            const slicerStats = _.pick(exStatus._slicer_stats, [
                'queued',
                'failed',
                'processed',
                'job_duration',
            ]);

            signale.debug(`Job Status Failure:
                job: "${exStatus.job_id}";
                job name: "${exStatus.name}";
                ex: "${exStatus.ex_id}";
                workers: ${exStatus.workers};
                slicers: ${exStatus.slicers};
                status: expected "${exStatus._status || lastStatus}" to equal "${status}";
                slicer stats: ${printObj(slicerStats)};
                failed after: ${Date.now() - start}ms;
                failure reasons: ${printObj(reasons)};
                `);

            return null;
        } catch (err) {
            return null;
        }
    }

    try {
        const result = await job.waitForStatus(status, interval, 2 * 60 * 1000);
        if (endDelay) {
            // since most of the time we are chaining this with other actions
            // make sure we avoid unrealistic test conditions by giving the
            // it a little bit of time
            await Promise.delay(endDelay);
        }
        return result;
    } catch (err) {
        err.message = `Job: ${jobId}: ${err.message}`;

        await Promise.all([
            logExErrors(err.lastStatus),
            logExStatus(),
        ]);

        throw err;
    }
}

async function waitForIndexCount(index, expected, remainingMs = 30 * 1000) {
    if (remainingMs <= 0) {
        throw new Error(`Timeout waiting for ${index} to have count of ${expected}`);
    }

    const start = Date.now();
    let count = 0;

    try {
        ({ count } = await misc.indexStats(index));
        if (count >= expected) {
            return count;
        }
    } catch (err) {
        // it probably okay
    }

    await Promise.delay(50);
    const elapsed = Date.now() - start;
    return waitForIndexCount(index, expected, remainingMs - elapsed);
}

module.exports = {
    forValue,
    forLength,
    forNodes,
    forWorkers,
    scaleWorkersAndWait,
    forWorkersJoined,
    waitForJobStatus,
    waitForIndexCount,
    waitForClusterState
};
