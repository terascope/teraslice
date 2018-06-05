'use strict';

const _ = require('lodash');
const misc = require('../../misc')();
const wait = require('../../wait')();

module.exports = function clusterStateTest() {
    const teraslice = misc.teraslice();

    function findWorkers(nodes, type, jobId) {
        return _.filter(nodes, (worker) => {
            if (jobId) {
                if (type) {
                    return worker.assignment === type && worker.job_id === jobId;
                }

                return worker.job_id === jobId;
            }

            return worker.assignment === type;
        });
    }

    function checkState(state, type, jobId) {
        return _.flatten(_.map(state, node => findWorkers(node.active, type, jobId))).length;
    }

    function verifyClusterState(state, nodeCount) {
        // 2 nodes by default
        const nodes = _.keys(state);
        expect(nodes.length).toBe(nodeCount);
        nodes.forEach((node) => {
            expect(state[node].total).toBe(8);
            expect(state[node].node_id).toBeDefined();
            expect(state[node].hostname).toBeDefined();

            // Nodes should have 6-8 workers available.
            expect(state[node].available).toBeLessThan(9);
            expect(state[node].available).toBeGreaterThan(5);

            // Should be two workers active if only 6 available
            if (state[node].available === 6) {
                expect(state[node].active.length).toBe(2);

                const workers = findWorkers(state[node].active, 'cluster_master');

                expect(workers.length).toBe(1);
                expect(workers[0].assignment).toBe('cluster_master');
            } else {
                expect(state[node].active.length).toBe(0);
            }
        });
    }

    describe('cluster state', () => {
        it('should match default configuration', (done) => {
            teraslice.cluster.state()
                .then((state) => {
                    verifyClusterState(state, 3);
                })
                .catch(fail)
                .finally(done);
        });

        it('should update after adding and removing a worker node', (done) => {
            // Add a second worker node
            misc.scale(2)
                .then(() =>
                    // Wait for it to show up in cluster state.
                    wait.forNodes(3))
                .then(() => teraslice.cluster.state())
                .then((state) => {
                    verifyClusterState(state, 3);
                })
                .then(() =>
                    // Scale back to a single worker.
                    misc.scale(1))
                .then(() =>
                    // Should just be 2 nodes now.
                    wait.forNodes(2))
                .then(() => teraslice.cluster.state())
                .then((state) => {
                    verifyClusterState(state, 2);
                })
                .catch(fail)
                .finally(done);
        });

        it('should update after adding and removing 20 worker nodes', (done) => {
            // Add additional worker nodes. There's one already and we want 20 more.
            misc.scale(21)
                .then(() =>
                    // Wait for all the nodes to show up in cluster state.
                    wait.forNodes(22))
                .then(() => teraslice.cluster.state())
                .then((state) => {
                    verifyClusterState(state, 22);
                })
                .then(() =>
                    // Scale back to a single worker.
                    misc.scale(1))
                .then(() =>
                    // Should just be 2 nodes now.
                    wait.forNodes(2))
                .then(() => teraslice.cluster.state())
                .then((state) => {
                    verifyClusterState(state, 2);
                })
                .catch(fail)
                .finally(done);
        });

        it('should be correct for running job with 1 worker', (done) => {
            const jobSpec = misc.newJob('reindex');
            jobSpec.name = 'cluster state with 1 worker';
            jobSpec.operations[0].index = 'example-logs-1000';
            jobSpec.operations[0].size = 100;
            jobSpec.operations[1].index = 'test-clusterstate-job-1-1000';
            let jobId;

            teraslice.jobs.submit(jobSpec)
                .then((job) => {
                    jobId = job.id();
                    // The job may run for a while so we have to wait for it to finish.
                    return job
                        .waitForStatus('running')
                        .then(() => teraslice.cluster.state())
                        .then((state) => {
                            const nodes = _.keys(state);
                            nodes.forEach((node) => {
                                expect(state[node].total).toBe(8);

                                // There are 2 nodes in the cluster so the slicer
                                // should go on one and the worker on the other.
                                // Nodes should have either 6 or 7 available workers.
                                expect(state[node].available).toBeLessThan(8);
                                expect(state[node].available).toBeGreaterThan(5);

                                // The node with more than one worker should have the actual worker
                                // and there should only be one.
                                if (state[node].active.length > 2) {
                                    expect(findWorkers(state[node].active, 'worker', jobId).length).toBe(1);
                                }

                                if (state[node].available === 7) {
                                    expect(state[node].active.length).toBe(1);
                                } else {
                                    expect(state[node].active.length).toBe(2);
                                }
                            });
                        })
                        .then(() => job.waitForStatus('completed'));
                })
                .then(() => misc.indexStats('test-clusterstate-job-1-1000')
                    .then((stats) => {
                        expect(stats.count).toBe(1000);
                        expect(stats.deleted).toBe(0);
                    }))
                .catch((err) => {
                    fail(err);
                })
                .finally(done);
        });

        it('should be correct for running job with 3 workers', (done) => {
            const jobSpec = misc.newJob('reindex');
            jobSpec.name = 'cluster state with 3 workers';
            jobSpec.workers = 3;
            jobSpec.operations[0].index = 'example-logs-1000';
            jobSpec.operations[0].size = 20;
            jobSpec.operations[1].index = 'test-clusterstate-job-3-1000';
            let jobId;

            teraslice.jobs.submit(jobSpec)
                .then((job) => {
                    // The job may run for a while so we have to wait for it to finish.
                    jobId = job.id();

                    return job
                        .waitForStatus('running')
                        .then(() => teraslice.cluster.state())
                        .then((state) => {
                            const nodes = _.keys(state);
                            nodes.forEach((node) => {
                                expect(state[node].total).toBe(8);

                                // There are 2 nodes in the cluster so the slicer
                                // should go on one and the workers should spread
                                // across the nodes leaving one with 6 workers avail
                                // and one with 4 avail.
                                expect(state[node].available).toBeLessThan(7);
                                expect(state[node].available).toBeGreaterThan(3);

                                // Both nodes should have at least one worker.
                                expect(findWorkers(state[node].active, 'worker', jobId).length).toBeGreaterThan(0);

                                expect(checkState(state, null, jobId)).toBe(4);
                            });
                        })
                        .then(() => job.waitForStatus('completed'));
                })
                .then(() => misc.indexStats('test-clusterstate-job-3-1000')
                    .then((stats) => {
                        expect(stats.count).toBe(1000);
                        expect(stats.deleted).toBe(0);
                    }))
                .catch(fail)
                .finally(done);
        });
    });
};
