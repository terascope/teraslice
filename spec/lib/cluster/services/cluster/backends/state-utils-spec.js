'use strict';

const fs = require('fs');
const path = require('path');

const moment = require('moment');

const stateUtils = require('../../../../../../lib/cluster/services/cluster/backends/state-utils');
const { dateFormat } = require('../../../../../../lib/utils/date_utils');

const clusterStateFile = path.join(__dirname, 'files', 'sample-state.json');


describe('stateUtils', () => {
    let clusterState;

    beforeEach(() => {
        clusterState = JSON.parse(fs.readFileSync(clusterStateFile, 'utf-8'));
    });

    describe('->_iterateState', () => {
        it('can filter worker list and return cluster master node', () => {
            const workerList = stateUtils._iterateState(
                clusterState,
                worker => worker.assignment === 'cluster_master'
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

    describe('->newGetSlicerStats', () => {
        it('returns valid slicerStats', async () => {
            let slicerStats;
            const context = { sysconfig: { teraslice: { action_timeout: 5 } } };
            const msgResponse = {
                node_id: 'node2.lan',
                job_id: 'a1af76a0-a2bd-457d-b14a-f11e5f04b9a1',
                ex_id: '8d7669e1-d351-4a0d-b36e-b11da5ade26a',
                payload: {
                    name: 'steve',
                    stats: {
                        workers_available: 0,
                        workers_active: 0,
                        workers_joined: 0,
                        workers_reconnected: 0,
                        workers_disconnected: 0,
                        failed: 0,
                        subslices: 0,
                        queued: 0,
                        slice_range_expansion: 0,
                        processed: 0,
                        slicers: 0,
                        subslice_by_key: 0,
                        started: moment().format(dateFormat)
                    }
                }
            };

            const messaging = {
                send: () => msgResponse,
                listRooms: () => ([
                    'node2.lan',
                ])
            };

            const getSlicerStats = stateUtils.newGetSlicerStats(clusterState, context, messaging);

            try {
                slicerStats = await getSlicerStats(
                    ['8d7669e1-d351-4a0d-b36e-b11da5ade26a'],
                    '8d7669e1-d351-4a0d-b36e-b11da5ade26a'
                );
            } catch (e) {
                console.error(e); // eslint-disable-line no-console
                expect(e).not.toBeDefined();
            }
            expect(slicerStats[0].ex_id).toEqual('8d7669e1-d351-4a0d-b36e-b11da5ade26a');
        });
    });
});
