/* eslint-disable jest/expect-expect */
import { pDelay, flatten } from '@terascope/core-utils';
import signale from '../../signale.js';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';

const { WORKERS_PER_NODE, DEFAULT_NODES, TEST_PLATFORM } = config;

describe('cluster state', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    function findWorkers(nodes: any[], type?: string, exId?: string) {
        return nodes.filter((worker) => {
            if (exId) {
                if (type) {
                    return worker.assignment === type && worker.ex_id === exId;
                }

                return worker.ex_id === exId;
            }

            return worker.assignment === type;
        });
    }

    function checkState(state: any[], type?: string, exId?: string) {
        const nodes = Object.values(state);
        return flatten(nodes.map((node) => findWorkers(node.active, type, exId))).length;
    }

    function verifyClusterMaster(state: any) {
        // verify that the cluster master worker exists within the state
        const nodes = Object.values(state).filter((node: any) => {
            const cms = findWorkers(node.active, 'cluster_master');
            return cms.length > 0;
        }) as any;

        expect(nodes).toBeArrayOfSize(1);

        // verify that the cluster master has the cluster master worker
        const activeWorkers = nodes[0].active;
        expect(activeWorkers.length).toBeGreaterThanOrEqual(1);
        const cmWorkers = findWorkers(activeWorkers, 'cluster_master');
        expect(cmWorkers).toBeArrayOfSize(1);
        expect(cmWorkers[0].assignment).toEqual('cluster_master');

        // verify that the cluster master has the assets service worker
        const amWorkers = findWorkers(activeWorkers, 'assets_service');
        expect(amWorkers).toBeArrayOfSize(1);
        expect(amWorkers[0].assignment).toEqual('assets_service');
    }

    function verifyClusterState(state: any[], workersAdded = 0) {
        expect(Object.values(state)).toBeArrayOfSize(DEFAULT_NODES + workersAdded);

        // verify each node TODO: fix types here
        Object.values(state).forEach((node) => {
            expect(node.total).toBe(WORKERS_PER_NODE);
            expect(node.node_id).toBeDefined();
            expect(node.hostname).toBeDefined();

            expect(node.available).toBeWithin(0, WORKERS_PER_NODE + 1);

            const expectActiveLength = node.total - node.available;
            const actualLength = node.active.length;
            if (actualLength !== expectActiveLength) {
                signale.warn(
                    `Expected node.active "${
                        node.active.length
                    }" to equal "${expectActiveLength}" node.total - node.available`
                );
            }
        });

        // verify cluster master
        verifyClusterMaster(state);
    }

    it('should match default configuration', async () => {
        const state = await terasliceHarness.teraslice.cluster.state() as any;
        verifyClusterState(state);
    });

    it('should update after adding and removing a worker node', async () => {
        // @ts-expect-error
        verifyClusterState(await terasliceHarness.scaleWorkersAndWait(1), 1);
        // @ts-expect-error
        verifyClusterState(await terasliceHarness.scaleWorkersAndWait());
    });

    it('should be correct for running job with 1 worker', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        const specIndex = terasliceHarness.newSpecIndex('state');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'cluster state with 1 worker';
        jobSpec.workers = 1;

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[0].size = 100;
        jobSpec.operations[1].index = specIndex;

        const ex = await terasliceHarness.submitAndStart(jobSpec, 5000);

        await pDelay(1000);
        const exId = ex.id();

        const state = await terasliceHarness.teraslice.cluster.state();

        const complete = terasliceHarness.waitForExStatus(ex, 'completed');

        const nodes = Object.keys(state) as any[];

        nodes.forEach((node) => {
            expect(state[node].total).toBe(WORKERS_PER_NODE);

            expect(state[node].available).toBeWithin(0, WORKERS_PER_NODE + 1);

            // The node with more than one worker should have the actual worker
            // and there should only be one.
            if (state[node].active.length > 2) {
                expect(findWorkers(state[node].active, 'worker', exId)).toBeArrayOfSize(1);
            }
            // @ts-expect-error
            expect(checkState(state, null, exId)).toBe(2);
        });

        await complete;

        const stats = await terasliceHarness.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });

    it('should be correct for running job with 4 workers', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        const specIndex = terasliceHarness.newSpecIndex('state');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.1;
        }
        jobSpec.name = 'cluster state with 4 workers';
        jobSpec.workers = 4;

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(1000);
        jobSpec.operations[0].size = 20;
        jobSpec.operations[1].index = specIndex;

        const ex = await terasliceHarness.submitAndStart(jobSpec, 5000);
        await pDelay(1000);
        const exId = ex.id();

        const state = await terasliceHarness.teraslice.cluster.state();
        const nodes = Object.keys(state);

        const complete = terasliceHarness.waitForExStatus(ex, 'completed');

        nodes.forEach((node) => {
            expect(state[node].total).toBe(WORKERS_PER_NODE);

            expect(state[node].available).toBeWithin(0, WORKERS_PER_NODE + 1);

            // Both nodes should have at least one worker.
            expect(findWorkers(state[node].active, 'worker', exId).length).toBeGreaterThan(0);
            // @ts-expect-error
            expect(checkState(state, null, exId)).toBe(5);
        });

        await complete;
        const { count } = await terasliceHarness.indexStats(specIndex);
        expect(count).toBe(1000);
    });
});
