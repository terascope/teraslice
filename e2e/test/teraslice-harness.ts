import ms from 'ms';
import {
    pDelay, uniq, toString,
    cloneDeep, isEmpty, castArray, pRetry
} from '@terascope/utils';
import { showState } from '@terascope/scripts';
import { JobConfig, Teraslice } from '@terascope/types';
import { createClient, ElasticsearchTestHelpers, Client, ClientConfig } from '@terascope/opensearch-client';
import { TerasliceClient } from 'teraslice-client-js';
import fse from 'fs-extra';
import {
    TEST_HOST, HOST_IP, SPEC_INDEX_PREFIX,
    DEFAULT_NODES, newId, DEFAULT_WORKERS, GENERATE_ONLY,
    EXAMPLE_INDEX_SIZES, EXAMPLE_INDEX_PREFIX, TEST_PLATFORM, TERASLICE_PORT,
    LOG_PATH, ENCRYPT_OPENSEARCH, OPENSEARCH_USER, OPENSEARCH_PASSWORD, ROOT_CERT_PATH
} from './config.js';
import { scaleWorkers, getElapsed } from './docker-helpers.js';
import signale from './signale.js';
import generatorToESJob from './fixtures/jobs/generate-to-es.js';
import generatorAssetJob from './fixtures/jobs/generator-asset.js';
import generatorLargeAssetJob from './fixtures/jobs/generator-large-asset.js';
import generatorJob from './fixtures/jobs/generator.js';
import idJob from './fixtures/jobs/id.js';
import kafkaReaderJob from './fixtures/jobs/kafka-reader.js';
import kafkaSenderJob from './fixtures/jobs/kafka-sender.js';
import multisendJob from './fixtures/jobs/multisend.js';
import reindexJob from './fixtures/jobs/reindex.js';
import { defaultAssetBundles } from './download-assets.js';

const JobDict = Object.freeze({
    'generate-to-es': generatorToESJob,
    'generator-asset': generatorAssetJob,
    'generator-large-asset': generatorLargeAssetJob,
    generator: generatorJob,
    id: idJob,
    'kafka-reader': kafkaReaderJob,
    'kafka-sender': kafkaSenderJob,
    multisend: multisendJob,
    reindex: reindexJob,
});

export type JobFixtureNames = keyof typeof JobDict;

const { cleanupIndex } = ElasticsearchTestHelpers;

const generateOnly = GENERATE_ONLY ? parseInt(GENERATE_ONLY, 10) : null;

/// This grabs the state index string from a list of indices as
/// the index names are slightly randomized
function getStateIndexString(indices: string) {
    const words = indices.split(' ');

    for (const word of words) {
        if (word.includes('__state')) {
            return word;
        }
    }

    // Return null if no matching word is found
    return null;
}

export class TerasliceHarness {
    client!: Client;
    teraslice!: TerasliceClient;

    async init() {
        const esConfig: ClientConfig = { node: TEST_HOST };
        if (ENCRYPT_OPENSEARCH) {
            esConfig.username = OPENSEARCH_USER;
            esConfig.password = OPENSEARCH_PASSWORD;
            esConfig.caCertificate = fse.readFileSync(ROOT_CERT_PATH, 'utf8');
        }
        // I should be able to not do this if I add a probe to os2
        const { client } = await pRetry(async () => {
            return await createClient(esConfig);
        }, { delay: 500, retries: 3 });
        this.client = client;
        this.teraslice = new TerasliceClient({
            host: `http://${HOST_IP}:${TERASLICE_PORT}`,
            timeout: 2 * 60 * 1000
        });
    }
    // TODO: look at types here

    async logExErrors(ex: any, exId: string) {
        const errors = await ex.errors();
        this.warn(`waitForStatus: ${exId} errors`, errors);
    }

    // TODO: look at types here
    warn(msg: string, obj: any) {
        if (isEmpty(obj)) return;
        signale.warn(`${msg}: ${JSON.stringify(obj, null, 2)}`);
    }

    async logClusterState() {
        const state = await this.teraslice.cluster.state();
        this.warn('Cluster State on Job Failure', state);
    }

    async logExStatus(ex: any) {
        const config = await ex.config();
        this.warn('ex status', config);
    }
    // TODO: look at types here

    async waitForExStatus(
        ex: any,
        status: string,
        interval = 100,
        endDelay = 50
    ) {
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

        if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
            try {
                cleanupIndex(this.client, `${SPEC_INDEX_PREFIX}*`);
                await showState(TERASLICE_PORT); // adds logs at debug level
            } catch (err) {
                signale.error('Failure to clean indices and assets', err);
                throw err;
            }
            // TODO: If tests are ever implemented to scale nodes in Kind,
            // a scaleWorkers implementation will need to be created that works with Kind.
            // As of Oct 2023 Kind doesn't let you scale nodes w/o restarting the cluster.
        } else {
            const state = await this.teraslice.cluster.state();

            await Promise.all([
                pDelay(800),
                cleanupIndex(this.client, `${SPEC_INDEX_PREFIX}*`),
                (async () => {
                    const cleanupExIds: string[] = [];
                    Object.values(state).forEach((node) => {
                        node.active.filter(Teraslice.isExecutionProcess)
                            .forEach((process) => {
                                const { ex_id: exId } = process;
                                cleanupExIds.push(exId);
                            });
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
                    const count = Object.keys(state).length;
                    if (count !== DEFAULT_NODES) {
                        signale.warn(`resetting cluster state of ${count} nodes`);
                        await scaleWorkers();
                        await this.forWorkers();
                    }
                })()
            ]);
        }

        const elapsed = Date.now() - startTime;
        if (elapsed > 1000) {
            signale.warn(`resetting took ${ms(elapsed)}`);
        }
    }

    async submitAndStart(jobSpec: any, delay?: number) {
        if (delay) {
            this.injectDelay(jobSpec, delay);
        }

        const ex = await this.teraslice.executions.submit(jobSpec);
        await this.waitForExStatus(ex, 'running');
        return ex;
    }

    async indexStats(indexName: string) {
        // delay for 100ms because sometimes the execution
        // is marked as complete but the indices stats is one off
        // because it happened too quickly
        await pDelay(100);

        await this.client.indices.refresh({ index: indexName });
        const stats = await this.client.indices.stats({ index: indexName });

        return stats._all.total.docs;
    }

    async runEsJob(jobSpec: any, index: string, delay?: number) {
        if (delay) {
            this.injectDelay(jobSpec, delay);
        }

        const ex = await this.teraslice.executions.submit(jobSpec);
        await this.waitForExStatus(ex, 'completed');

        try {
            const stats = await this.indexStats(index);
            return stats?.count;
        } catch (err) {
            throw new Error(`Unable to get stats for index ${index}`);
        }
    }

    /**
 * Test pause
 */

    async getSliceSuccess(ex: any) {
        // TODO: this seems wrong
        const indices = await this.client.cat.indices();
        const indexString = getStateIndexString(indices as any);
        const query = {
            index: indexString,
            body: {
                query: {
                    match: { ex_id: ex.id() }
                }
            }
        };
        const sliceRecord = await this.client.search(query as any);
        // @ts-expect-error
        const sliceStatus = sliceRecord.hits.hits[0]._source.state;
        if (sliceStatus !== 'completed') {
            throw Error;
        }
        return true;
    }

    async testJobLifeCycle(jobSpec: any, delay = 3000) {
        let ex: any;
        const waitForStatus = async (status: string) => this.waitForExStatus(ex, status, 50, 0);

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
            /// NOTE: This is an edgecase where the ex marks itself as `failed` during shutdown
            /// because of a race condition with elasticsearch not updating the state index.
            /// We may need to reconsider revising how we implement this test.
            if (errStr.includes('"stopped"') && errStr.includes('"failed"')) {
                const cb = () => {
                    try {
                        const state = this.getSliceSuccess(ex);
                        return state;
                    } catch {
                        throw Error;
                    }
                };

                const sliceCompleted = await pRetry(cb, { delay: 2000 });

                if (sliceCompleted) {
                    signale.warn(
                        `${errStr} - however since this can be race condition, we don't want to fail the test
                        in the condition that the slice still completes.`
                    );
                    return ex;
                }

                throw err;
            }

            throw err;
        }

        ex = await ex.recover();
        await waitForStatus('completed');
        return ex;
    }

    newSpecIndex(name: string) {
        return newId(`${SPEC_INDEX_PREFIX}-${name}`, true, 4);
    }

    injectDelay(jobSpec: any, time = 1000) {
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
    async forLength(func: any, value: any, iterations?: number) {
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
    async forValue(func: any, value: any, iterations = 100) {
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

    async waitForWorkerCount(exId: string, workerCount = DEFAULT_WORKERS, timeoutMs = 30000) {
        const endAt = Date.now() + timeoutMs;

        const _waitForK8sWorker = async (): Promise<number> => {
            if (Date.now() > endAt) {
                throw new Error(`Failure scaling workers to ${workerCount} within ${timeoutMs}ms`);
            }

            const workers = (await this.teraslice.executions.wrap(exId).workers()).length;

            if (workerCount === workers) return workers;
            await pDelay(1000);
            return _waitForK8sWorker();
        };

        return _waitForK8sWorker();
    }

    async scaleWorkersAndWait(workersToAdd = 0) {
        const workerCount = DEFAULT_WORKERS + workersToAdd;
        await pDelay(500);

        const state = await this.teraslice.cluster.state();
        // TODO: this seems wrong
        if (Object.keys(state).length === workerCount) {
            return state;
        }

        await scaleWorkers(workersToAdd);
        await this.forWorkers(workerCount);
        await pDelay(500);

        return this.teraslice.cluster.state();
    }

    newJob(name: JobFixtureNames): JobConfig {
        const job = JobDict[name];

        if (!job) {
            throw new Error(`Invalid job reference ${name} does not exist`);
        }

        return cloneDeep(job) as JobConfig;
    }

    /*
 * Wait for 'workerCount' workers to be joined on execution 'jobId'.  `iterations`
 * is passed to forValue and indicates how many times the condition will be
 * tested for.
 * TODO: Implement a more generic function that waits for states other than
 * 'joined'
 */
    forWorkersJoined(exId: string, workerCount: number, iterations?: number) {
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

        const _waitForClusterState = async (): Promise<number> => {
            if (Date.now() > endAt) {
                throw new Error(`Failure to communicate with the Cluster Master as ${timeoutMs}ms`);
            }

            let nodes = -1;
            try {
                const result = await this.teraslice.cluster.get('cluster/state', {
                    timeout: {
                        request: 500
                    },
                    responseType: 'json',
                });
                nodes = Object.keys(result).length;
            } catch (err) {
                return _waitForClusterState();
            }

            if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
                // A get request to 'cluster/state' will return an empty object in kubernetes.
                // Therefore nodes will be 0.
                if (nodes === 0) return nodes;
            }
            if (nodes >= DEFAULT_NODES) return nodes;
            return _waitForClusterState();
        };

        return _waitForClusterState();
    }

    async waitForIndexCount(
        index: string,
        expected: number,
        remainingMs = 30 * 1000
    ): Promise<number> {
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
        return fse.writeFile(LOG_PATH, '');
    }

    async waitForTeraslice() {
        const startTime = Date.now();
        signale.pending('Waiting for Teraslice...');

        const nodes = await this.waitForClusterState();

        if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
            signale.success(`Teraslice is ready to go at port ${TERASLICE_PORT}`, getElapsed(startTime));
        } else {
            signale.success(`Teraslice is ready to go at port ${TERASLICE_PORT} with ${nodes} nodes`, getElapsed(startTime));
        }
    }

    async postJob(jobSpec: any) {
        return this.teraslice.executions.submit(jobSpec);
    }

    async generate(count: number, hex?: string[]) {
        if (generateOnly && generateOnly !== count) return;

        const genStartTime = Date.now();
        let indexName = this.getExampleIndex(count);
        const requiredAssets = ['elasticsearch', 'standard'];

        if (hex) {
            indexName += '-hex';
        }

        signale.info(`Generating ${indexName} example data`);
        const jobSpec = {
            name: `Generate: ${indexName}`,
            lifecycle: 'once',
            workers: 1,
            assets: requiredAssets,
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
        } as any;

        signale.info(`Validating assets..`);
        await pRetry(async () => {
            await this.validateAssets(requiredAssets);
        });
        signale.success(`Assets validated successfully!`);

        try {
            if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
                // Set resource constraints on workers and ex controllers within CI
                jobSpec.resources_requests_cpu = 0.05;
                jobSpec.cpu_execution_controller = 0.4;
            }

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

    getExampleIndex(size: number) {
        if (!EXAMPLE_INDEX_SIZES.includes(size)) {
            throw new Error(`No example index with ${size}`);
        }

        return `${EXAMPLE_INDEX_PREFIX}-${size}`;
    }

    /**
     *  Validates that all required assets exist and are available.
     *  Will throw if an asset isn't available.
     * @param assetsArray
     */
    async validateAssets(assetsArray: string[]): Promise<void> {
        const assets = await this.teraslice.assets.list();

        for (const requiredAsset of assetsArray) {
            let found = false;
            for (const asset of assets) {
                if (asset.name === requiredAsset) {
                    // In the case we are using s3-storage
                    if (
                        asset.external_storage
                        && asset.external_storage === 'available'
                    ) {
                        found = true;
                        break;
                    } else if (
                        asset.external_storage
                        && asset.external_storage !== 'available'
                    ) {
                        const e = `Asset ${asset.name} with id ${asset.id} is not available in the s3 backend.`;
                        throw new Error(e);
                    } else {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                const e = `Asset ${requiredAsset} not found in asset list.`;
                throw new Error(e);
            }
        }
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

    /*
    * Returns the IDs of the defaultAssetBundles that were downloaded into the autoload_directory
    * during jest global.setup, then autoloaded into the asset_directory. It might be better to use
    * AssetsStorage._getAssetId() for each asset a jobSpec needs for a test, but initializing an
    * AssetsStorage instance within a test was throwing errors. It may be related to the context
    * used to create it.
    */
    async getBaseAssetIds() {
        const assetList = await this.teraslice.assets.list();
        const baseAssetNames = defaultAssetBundles.map((bundle) => bundle.name);
        const baseAssetIds = assetList
            .filter((assetObj) => baseAssetNames.includes(assetObj.name))
            .map((assetObj) => assetObj.id);
        return baseAssetIds;
    }

    async addWorkers(exId: string, workersToAdd: number): Promise<number> {
        const currentWorkers = (await this.teraslice.executions.wrap(exId).workers()).length;
        const workerCount = currentWorkers + workersToAdd;
        await this.teraslice.jobs.post(`ex/${exId}/_workers?add=${workersToAdd}`);
        return this.waitForWorkerCount(exId, workerCount);
    }

    async removeWorkers(exId: string, workersToRemove: number): Promise<number> {
        const currentWorkers = (await this.teraslice.executions.wrap(exId).workers()).length;
        const workerCount = currentWorkers - workersToRemove;
        await this.teraslice.jobs.post(`ex/${exId}/_workers?remove=${workersToRemove}`);
        return this.waitForWorkerCount(exId, workerCount);
    }

    async setWorkers(exId: string, workerTotal: number): Promise<number> {
        await this.teraslice.jobs.post(`ex/${exId}/_workers?total=${workerTotal}`);
        return this.waitForWorkerCount(exId, workerTotal);
    }
}
