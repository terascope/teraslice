'use strict';

const ms = require('ms');
const {
    pDelay, uniq, toString,
    cloneDeep, isEmpty, castArray
} = require('@terascope/utils');
const { createClient, ElasticsearchTestHelpers } = require('elasticsearch-store');
const { TerasliceClient } = require('teraslice-client-js');
const path = require('path');
const fse = require('fs-extra');
const {
    TEST_HOST, HOST_IP, SPEC_INDEX_PREFIX,
    DEFAULT_NODES, newId, DEFAULT_WORKERS, GENERATE_ONLY,
    EXAMPLE_INDEX_SIZES, EXAMPLE_INDEX_PREFIX
} = require('./config');
const { scaleWorkers, getElapsed } = require('./docker-helpers');
const signale = require('./signale');

const { cleanupIndex } = ElasticsearchTestHelpers;

const generateOnly = GENERATE_ONLY ? parseInt(GENERATE_ONLY, 10) : null;

module.exports = class TerasliceHarness {
    async init() {
        const { client } = await createClient({ node: TEST_HOST });// create ES or OS db
        this.client = client;
        this.teraslice = new TerasliceClient({
            host: `http://${HOST_IP}:45678`,
            timeout: 2 * 60 * 1000
        });
    }

    async logExErrors(ex, exId) {
        const errors = await ex.errors();
        this.warn(`waitForStatus: ${exId} errors`, errors);
    }

    warn(msg, obj) {
        if (isEmpty(obj)) return;
        signale.warn(`${msg}: ${JSON.stringify(obj, null, 2)}`);
    }

    async logClusterState() {
        const state = await this.teraslice.cluster.state();
        this.warn('Cluster State on Job Failure', state);
    }

    async logExStatus(ex) {
        const config = await ex.config();
        this.warn('ex status', config);
    }

    async waitForExStatus(ex, status, interval = 100, endDelay = 50) {
        const exId = ex._exId;
        const start = Date.now();

        try {
            const result = await ex.waitForStatus(status, interval, 2 * 60 * 1000);
            if (endDelay) {
                // since most of the time we are chaining this with other actions
                // make sure we avoid unrealistic test conditions by giving the
                // it a little bit of time
                await pDelay(endDelay);
            }
            return result;
        } catch (err) {
            err.message = `Execution: ${ex.id()}: ${err.message}`;

            this.warn(err.stack, {
                failedAfter: ms(Date.now() - start),
                expectedStatus: status,
                lastStatus: err.lastStatus
            });

            await Promise.all([
                this.logExErrors(ex, exId),
                this.logExStatus(ex),
                this.logClusterState()
            ]).catch((e) => signale.warn(e));

            throw err;
        }
    }

    async resetState() {
        const startTime = Date.now();
        const state = await this.teraslice.cluster.state();

        await Promise.all([
            pDelay(800),
            cleanupIndex(this.client, `${SPEC_INDEX_PREFIX}*`),
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
                            await this.teraslice.executions.wrap(exId).stop({ blocking: true });
                        } catch (err) {
                        // ignore error;
                        }
                    })
                );
            })(),
            (async () => {
                if (process.env.TEST_PLATFORM === 'native') {
                    const count = Object.keys(state).length;
                    if (count !== DEFAULT_NODES) {
                        signale.warn(`resetting cluster state of ${count} nodes`);
                        await scaleWorkers();
                        await this.forWorkers();
                    }
                } else {
                    // Do nothing
                    // TODO: If tests are ever implemented to scale nodes in Kind,
                    // a scaleWorkers implementation will need to be created that works with Kind.
                    // As of Oct 2023 Kind doesn't let you scale nodes w/o restarting the cluster.
                }
            })()
        ]);

        const elapsed = Date.now() - startTime;
        if (elapsed > 1000) {
            signale.warn(`resetting took ${ms(elapsed)}`);
        }
    }

    async submitAndStart(jobSpec, delay) {
        if (delay) {
            this.injectDelay(jobSpec, delay);
        }

        const ex = await this.teraslice.executions.submit(jobSpec);
        await this.waitForExStatus(ex, 'running');
        return ex;
    }

    async indexStats(indexName) {
        // delay for 100ms because sometimes the execution
        // is marked as complete but the indices stats is one off
        // because it happened too quickly
        await pDelay(100);

        await this.client.indices.refresh({ index: indexName });
        const stats = await this.client.indices.stats({ index: indexName });

        return stats._all.total.docs;
    }

    async runEsJob(jobSpec, index, delay) {
        if (delay) {
            this.injectDelay(jobSpec, delay);
        }

        const ex = await this.teraslice.executions.submit(jobSpec);
        await this.waitForExStatus(ex, 'completed');

        try {
            const stats = await this.indexStats(index);
            return stats.count;
        } catch (err) {
            throw new Error(`Unable to get stats for index ${index}`);
        }
    }

    /**
 * Test pause
 */
    async testJobLifeCycle(jobSpec, delay = 3000) {
        let ex;
        const waitForStatus = async (status) => this.waitForExStatus(ex, status, 50, 0);

        if (delay) {
            this.injectDelay(jobSpec, delay);
        }

        ex = await this.teraslice.executions.submit(jobSpec);
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

    newSpecIndex(name) {
        return newId(`${SPEC_INDEX_PREFIX}-${name}`, true, 4);
    }

    injectDelay(jobSpec, time = 1000) {
        jobSpec.operations = [
            jobSpec.operations[0],
            {
                _op: 'delay',
                ms: time
            },
            ...jobSpec.operations.slice(1, jobSpec.operations.length)
        ];
    }

    /*
 * Waits for the promise returned by 'func' to resolve to an array
 * then waits for the length of that array to match 'value'.
 */
    async forLength(func, value, iterations) {
        async function _forLength() {
            const result = await func();
            return result.length;
        }

        return this.forValue(_forLength, value, iterations);
    }

    /*
 * Waits for the promise returned by 'func' to resolve to a value
 * that can be compared to 'value'. It will wait 'iterations' of
 * time for the value to match before the returned promise will
 * reject.
 */
    async forValue(func, value, iterations = 100) {
        let counter = 0;

        const multiplier = 2;
        const _iterations = iterations * multiplier;

        async function _forValue() {
            counter++;

            const result = await func();
            if (result === value) return result;

            if (counter > _iterations) {
                signale.warn('forValue last target value', {
                    actual: result,
                    expected: value,
                    iterations,
                    counter: Math.round(counter / multiplier)
                });

                throw new Error(`forValue didn't find target value after ${iterations} iterations.`);
            }

            await pDelay(250 * multiplier);
            return _forValue();
        }

        return _forValue();
    }

    /*
 * Wait for 'node_count' nodes to be available.
 */
    forNodes(nodeCount = DEFAULT_NODES) {
        const _forNodes = async () => {
            const state = await this.teraslice.cluster.state();
            return Object.keys(state);
        };

        return this.forLength(_forNodes, nodeCount);
    }

    async forWorkers(workerCount = DEFAULT_WORKERS) {
        const _forWorkers = async () => {
            const state = await this.teraslice.cluster.state();
            return Object.keys(state);
        };

        return this.forLength(_forWorkers, workerCount + 1);
    }

    async scaleWorkersAndWait(workersToAdd = 0) {
        const workerCount = DEFAULT_WORKERS + workersToAdd;
        await pDelay(500);

        const state = await this.teraslice.cluster.state();
        if (Object.keys(state) === workerCount) return state;

        await scaleWorkers(workersToAdd);
        await this.forWorkers(workerCount);
        await pDelay(500);

        return this.teraslice.cluster.state();
    }

    newJob(name) {
        return cloneDeep(require(`./fixtures/jobs/${name}.json`));
    }

    /*
 * Wait for 'workerCount' workers to be joined on execution 'jobId'.  `iterations`
 * is passed to forValue and indicates how many times the condition will be
 * tested for.
 * TODO: Implement a more generic function that waits for states other than
 * 'joined'
 */
    forWorkersJoined(exId, workerCount, iterations) {
        const _forWorkersJoined = async () => {
            const controllers = await this.teraslice.cluster.controllers();
            const controller = controllers.find((s) => s.ex_id === exId);
            if (!controller) return 0;
            return controller.workers_joined;
        };

        return this.forValue(_forWorkersJoined, workerCount, iterations);
    }

    waitForClusterState(timeoutMs = 120000) {
        const endAt = Date.now() + timeoutMs;

        const _waitForClusterState = async () => {
            if (Date.now() > endAt) {
                throw new Error(`Failure to communicate with the Cluster Master as ${timeoutMs}ms`);
            }

            let nodes = -1;
            try {
                const result = await this.teraslice.cluster.get('cluster/state', {
                    timeout: 500,
                    responseType: 'json',
                });
                nodes = Object.keys(result).length;
            } catch (err) {
                return _waitForClusterState();
            }

            if (process.env.TEST_PLATFORM === 'kubernetes') {
                // A get request to 'cluster/state' will return an empty object in kubernetes.
                // Therefore nodes will be 0.
                if (nodes === 0) return nodes;
            }
            if (nodes >= DEFAULT_NODES) return nodes;
            return _waitForClusterState();
        };

        return _waitForClusterState();
    }

    async waitForIndexCount(index, expected, remainingMs = 30 * 1000) {
        if (remainingMs <= 0) {
            throw new Error(`Timeout waiting for ${index} to have count of ${expected}`);
        }

        const start = Date.now();
        let count = 0;

        try {
            ({ count } = await this.indexStats(index));
            if (count >= expected) {
                return count;
            }
        } catch (err) {
        // it probably okay
        }

        await pDelay(50);
        const elapsed = Date.now() - start;

        return this.waitForIndexCount(index, expected, remainingMs - elapsed);
    }

    async resetLogs() {
        const logPath = path.join(__dirname, '..', 'logs', 'teraslice.log');
        await fse.writeFile(logPath, '');
    }

    async waitForTeraslice() {
        const startTime = Date.now();
        signale.pending('Waiting for Teraslice...');

        const nodes = await this.waitForClusterState();

        if (process.env.TEST_PLATFORM === 'kubernetes') {
            signale.success('Teraslice is ready to go', getElapsed(startTime));
        } else {
            signale.success(`Teraslice is ready to go with ${nodes} nodes`, getElapsed(startTime));
        }
    }

    async postJob(jobSpec) {
        return this.teraslice.executions.submit(jobSpec);
    }

    async generate(count, hex) {
        if (generateOnly && generateOnly !== count) return;

        const genStartTime = Date.now();
        let indexName = this.getExampleIndex(count);
        if (hex) {
            indexName += '-hex';
        }

        signale.info(`Generating ${indexName} example data`);
        const jobSpec = {
            name: `Generate: ${indexName}`,
            lifecycle: 'once',
            workers: 1,
            assets: ['elasticsearch', 'standard'],
            operations: [
                {
                    _op: 'data_generator',
                    size: count
                },
                {
                    _op: 'elasticsearch_bulk',
                    index: indexName,
                    type: 'events',
                    size: 1000
                }
            ]
        };

        try {
            if (hex) {
                jobSpec.operations[0].size = count / hex.length;
                jobSpec.operations[0].set_id = 'hexadecimal';
                jobSpec.operations[1].id_field = 'id';
                const result = await Promise.all(hex.map((letter) => {
                    jobSpec.name = `Generate: ${indexName}[${letter}]`;
                    jobSpec.operations[0].id_start_key = letter;
                    return this.postJob(jobSpec);
                }));
                const executions = castArray(result);
                await Promise.all(executions.map((ex) => this.waitForExStatus(ex, 'completed')));
            } else {
                const ex = await this.postJob(jobSpec);
                await this.waitForExStatus(ex, 'completed');
            }

            signale.info(`Generated ${indexName} example data`, getElapsed(genStartTime));
        } catch (err) {
            signale.error(`Failure to generate example data ${indexName}`, err);
            throw err;
        }
    }

    getExampleIndex(size) {
        if (!EXAMPLE_INDEX_SIZES.includes(size)) {
            throw new Error(`No example index with ${size}`);
        }

        return `${EXAMPLE_INDEX_PREFIX}-${size}`;
    }

    async generateTestData() {
        const startTime = Date.now();
        signale.pending('Generating example data...');

        try {
            await Promise.all(EXAMPLE_INDEX_SIZES.map((size) => this.generate(size)));
            // we need fully active jobs so we can get proper meta data for recovery state tests
            signale.success('Data generation is done', getElapsed(startTime));
        } catch (err) {
            signale.error('Data generation failed', getElapsed(startTime));
            throw err;
        }
    }
};
