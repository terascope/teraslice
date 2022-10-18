import { pDelay, flatten } from '@terascope/utils';
import misc from '../../misc.js';
import wait from '../../wait.js';
import signale from '../../signale.js';
import { resetState, submitAndStart } from '../../helpers.js';

const { waitForExStatus, scaleWorkersAndWait } = wait;

describe('cluster state', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    function findWorkers(nodes, type, exId) {
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

    function checkState(state, type, exId) {
        const nodes = Object.values(state);
        return flatten(nodes.map((node) => findWorkers(node.active, type, exId))).length;
    }

    function verifyClusterMaster(state) {
        // verify that the cluster master worker exists within the state
        const nodes = Object.values(state).filter((node) => {
            const cms = findWorkers(node.active, 'cluster_master');
            return cms.length > 0;
        });

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

    function verifyClusterState(state, workersAdded = 0) {
        expect(Object.values(state)).toBeArrayOfSize(misc.DEFAULT_NODES + workersAdded);

        // verify each node
        Object.values(state).forEach((node) => {
            expect(node.total).toBe(misc.WORKERS_PER_NODE);
            expect(node.node_id).toBeDefined();
            expect(node.hostname).toBeDefined();

            expect(node.available).toBeWithin(0, misc.WORKERS_PER_NODE + 1);

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
        const state = await teraslice.cluster.state();
        verifyClusterState(state);
    });

    it('should update after adding and removing a worker node', async () => {
        verifyClusterState(await scaleWorkersAndWait(1), 1);
        verifyClusterState(await scaleWorkersAndWait());
    });

    it('should be correct for running job with 1 worker', async () => {
        const jobSpec = misc.newJob('reindex');
        const specIndex = misc.newSpecIndex('state');
        jobSpec.name = 'cluster state with 1 worker';
        jobSpec.workers = 1;
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[0].size = 100;
        jobSpec.operations[1].index = specIndex;

        const ex = await submitAndStart(jobSpec, 5000);
        await pDelay(1000);
        const exId = ex.id();

        const state = await teraslice.cluster.state();

        const complete = waitForExStatus(ex, 'completed');
        const nodes = Object.keys(state);

        nodes.forEach((node) => {
            expect(state[node].total).toBe(misc.WORKERS_PER_NODE);

            expect(state[node].available).toBeWithin(0, misc.WORKERS_PER_NODE + 1);

            // The node with more than one worker should have the actual worker
            // and there should only be one.
            if (state[node].active.length > 2) {
                expect(findWorkers(state[node].active, 'worker', exId)).toBeArrayOfSize(1);
            }
            expect(checkState(state, null, exId)).toBe(2);
        });

        await complete;
        const stats = await misc.indexStats(specIndex);
        expect(stats.count).toBe(1000);
    });

    it('should be correct for running job with 4 workers', async () => {
        const jobSpec = misc.newJob('reindex');
        const specIndex = misc.newSpecIndex('state');

        jobSpec.name = 'cluster state with 4 workers';
        jobSpec.workers = 4;
        jobSpec.operations[0].index = misc.getExampleIndex(1000);
        jobSpec.operations[0].size = 20;
        jobSpec.operations[1].index = specIndex;

        const ex = await submitAndStart(jobSpec, 5000);
        await pDelay(1000);
        const exId = ex.id();

        const state = await teraslice.cluster.state();
        const nodes = Object.keys(state);

        const complete = waitForExStatus(ex, 'completed');

        nodes.forEach((node) => {
            expect(state[node].total).toBe(misc.WORKERS_PER_NODE);

            expect(state[node].available).toBeWithin(0, misc.WORKERS_PER_NODE + 1);

            // Both nodes should have at least one worker.
            expect(findWorkers(state[node].active, 'worker', exId).length).toBeGreaterThan(0);

            expect(checkState(state, null, exId)).toBe(5);
        });

        await complete;
        const { count } = await misc.indexStats(specIndex);
        expect(count).toBe(1000);
    });
});
