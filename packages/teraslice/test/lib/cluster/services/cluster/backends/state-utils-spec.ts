import fs from 'node:fs';
import path from 'node:path';
import * as stateUtils from '../../../../../../src/lib/cluster/services/cluster/backends/state-utils';
import type { ClusterState } from '../../../../../../src/interfaces';

const clusterStateFile = path.join(__dirname, 'files', 'sample-state.json');

describe('stateUtils', () => {
    let clusterState: ClusterState;

    beforeEach(() => {
        clusterState = JSON.parse(fs.readFileSync(clusterStateFile, 'utf-8'));
    });

    describe('->iterateState', () => {
        it('can filter worker list and return cluster master node', () => {
            const workerList = stateUtils.iterateState(
                clusterState,
                (worker) => worker.assignment === 'cluster_master'
            );
            expect(workerList[0].node_id).toEqual('node1.lan');
        });
    });

    describe('->findAllSlicers', () => {
        it('returns the right number of slicers', () => {
            const workerList = stateUtils.findAllSlicers(clusterState);
            expect(workerList[0].assignment).toEqual('execution_controller');
        });
    });

    describe('->findWorkersByExecutionID', () => {
        it('returns the right number of workers', () => {
            const workerList = stateUtils.findWorkersByExecutionID(
                clusterState,
                '8d7669e1-d351-4a0d-b36e-b11da5ade26a'
            );
            expect(workerList.length).toEqual(8);
        });
    });

    describe('->findSlicersByExecutionID', () => {
        it('returns execution_controller worker', () => {
            const workerList = stateUtils.findSlicersByExecutionID(
                clusterState,
                { '8d7669e1-d351-4a0d-b36e-b11da5ade26a': '8d7669e1-d351-4a0d-b36e-b11da5ade26a' }
            );
            expect(workerList[0].assignment).toEqual('execution_controller');
        });
    });
});
