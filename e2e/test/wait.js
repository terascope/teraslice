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
    return forValue(
        () => func()
            .then(result => result.length),
        value, iterations
    );
}

/*
 * Waits for the promise returned by 'func' to resolve to a value
 * that can be compared to 'value'. It will wait 'iterations' of
 * time for the value to match before the returned promise will
 * reject.
 */
function forValue(func, value, iterations = 100) {
    let counter = 0;

    return new Promise(((resolve, reject) => {
        function checkValue() {
            func()
                .then((result) => {
                    counter += 1;
                    if (result === value) {
                        resolve(result);
                        return;
                    }
                    if (counter > iterations) {
                        signale.debug('forValue last target value', {
                            actual: result,
                            expected: value,
                            iterations,
                            counter
                        });
                        reject(new Error(`forValue didn't find target value after ${iterations} iterations.`));
                    } else {
                        setTimeout(checkValue, 500);
                    }
                });
        }

        checkValue();
    }));
}

/*
 * Wait for 'node_count' nodes to be available.
 */
function forNodes(nodeCount = misc.DEFAULT_NODES) {
    return forLength(() => misc.teraslice().cluster
        .state()
        .then(state => _.keys(state)), nodeCount);
}

function forWorkers(workerCount = misc.DEFAULT_WORKERS) {
    return forLength(() => misc.teraslice().cluster
        .state()
        .then(state => _.keys(state)), workerCount + 1);
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
    return forValue(() => misc.teraslice().cluster
        .controllers()
        .then((controllers) => {
            const controller = _.find(controllers, s => s.job_id === jobId);
            if (controller !== undefined) {
                return controller.workers_joined;
            }
            return 0;
        }), workerCount, iterations)
        .catch((e) => {
            throw (new Error(`(forWorkersJoined) ${e}`));
        });
}

function waitForClusterState(timeoutMs = 120000) {
    const endAt = Date.now() + timeoutMs;
    const { cluster } = misc.teraslice();
    function _try() {
        if (Date.now() > endAt) {
            return Promise.reject(new Error(`Failure to communicate with the Cluster Master as ${timeoutMs}ms`));
        }
        return cluster.get('/cluster/state', {
            timeout: 1000,
            json: true,
        })
            .then((result) => {
                const nodes = _.size(_.keys(result));
                if (nodes >= misc.DEFAULT_NODES) {
                    return nodes;
                }
                return _try();
            })
            .catch(() => _try());
    }

    return _try();
}

function waitForJobStatus(job, status) {
    const jobId = job._jobId;

    function logExErrors() {
        return job.errors()
            .then((errors) => {
                if (_.isEmpty(errors)) {
                    return null;
                }
                signale.debug(`waitForStatus: ${jobId} errors`, errors);
                return null;
            })
            .catch(() => null);
    }

    function logExStatus() {
        return job.get(`/jobs/${jobId}/ex`)
            .then((exStatus) => {
                if (_.isEmpty(exStatus)) {
                    return null;
                }
                signale.debug(`waitForStatus: ${jobId} ex status`, exStatus);
                return null;
            })
            .catch(() => null);
    }

    return job.waitForStatus(status, 100, 2 * 60 * 1000)
        // since most of the time we are chaining this with other actions
        // make sure we avoid unrealistic test conditions by giving the
        // it a little bit of time
        .then(result => Promise.delay(500).then(() => result))
        .catch(async (err) => {
            err.message = `Job: ${jobId}: ${err.message}`;
            await logExErrors();
            await logExStatus();
            return Promise.reject(err);
        });
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

    await Promise.delay(100);
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
