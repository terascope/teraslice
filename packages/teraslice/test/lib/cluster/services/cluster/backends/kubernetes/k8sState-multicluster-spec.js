'use strict';

const _ = require('lodash');
const _podsJobRunning = require('./files/job-running-v1-k8s-pods-multicluster.json');
const k8sState = require('../../../../../../../lib/cluster/services/cluster/backends/kubernetes/k8sState');

describe('k8sState with pods from multiple clusters', () => {
    it('should generate cluster state correctly on first call', () => {
        const podsJobRunning = _.cloneDeep(_podsJobRunning);
        const clusterState = {};

        k8sState.gen(podsJobRunning, clusterState, 'ts-dev1');
        // console.log(`clusterState\n\n${JSON.stringify(clusterState, null, 2)}`);
        // console.log(JSON.stringify(podsJobRunning, null, 2));

        expect(clusterState['192.168.99.100'].state).toEqual('connected');
        expect(clusterState['192.168.99.100'].active.length).toEqual(3);
        expect(clusterState['192.168.99.100'].active[1])
            .toEqual({
                worker_id: 'teraslice-execution_controller-123456-784cbt5mz',
                assignment: 'execution_controller',
                pod_name: 'teraslice-execution_controller-123456-784cbt5mz',
                ex_id: '123456',
                job_id: '654321',
                pod_ip: '172.17.0.5',
                assets: [],
                image: 'docker.registry.example/teraslice:0.0.0'
            });
        expect(clusterState['192.168.99.100'].active[2])
            .toEqual({
                worker_id: 'teraslice-worker-123456-8b68v7p8t',
                assignment: 'worker',
                pod_name: 'teraslice-worker-123456-8b68v7p8t',
                ex_id: '123456',
                job_id: '654321',
                pod_ip: '172.17.0.6',
                assets: [],
                image: 'docker.registry.example/teraslice:0.0.0'
            });
    });

    it('should generate cluster state correctly on second call', () => {
        const podsJobRunning = _.cloneDeep(_podsJobRunning);
        const clusterState = {};

        k8sState.gen(podsJobRunning, clusterState, 'ts-dev1');
        k8sState.gen(podsJobRunning, clusterState, 'ts-dev1');

        expect(clusterState['192.168.99.100'].state).toEqual('connected');
        expect(clusterState['192.168.99.100'].active.length).toEqual(3);
        expect(clusterState['192.168.99.100'].active[1])
            .toEqual({
                worker_id: 'teraslice-execution_controller-123456-784cbt5mz',
                assignment: 'execution_controller',
                pod_name: 'teraslice-execution_controller-123456-784cbt5mz',
                ex_id: '123456',
                job_id: '654321',
                pod_ip: '172.17.0.5',
                assets: [],
                image: 'docker.registry.example/teraslice:0.0.0'
            });
        expect(clusterState['192.168.99.100'].active[2])
            .toEqual({
                worker_id: 'teraslice-worker-123456-8b68v7p8t',
                assignment: 'worker',
                pod_name: 'teraslice-worker-123456-8b68v7p8t',
                ex_id: '123456',
                job_id: '654321',
                pod_ip: '172.17.0.6',
                assets: [],
                image: 'docker.registry.example/teraslice:0.0.0'
            });
    });
});
