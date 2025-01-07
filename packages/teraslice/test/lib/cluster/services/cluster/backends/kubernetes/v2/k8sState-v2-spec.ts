import { cloneDeep } from '@terascope/utils';
import { ClusterState } from '@terascope/types';
import _podsJobRunning from '../files/job-running-v1-k8s-pods.json';
import { gen } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/k8sState.js';
import { TSPodList } from '../../../../../../../../src/lib/cluster/services/cluster/backends/kubernetesV2/interfaces.js';

describe('k8sState', () => {
    it('should generate cluster state correctly on first call', () => {
        const podsJobRunning = cloneDeep<TSPodList>(_podsJobRunning as any);
        const clusterState: ClusterState = {};

        gen(podsJobRunning, clusterState);
        // console.log(`clusterState\n\n${JSON.stringify(clusterState, null, 2)}`);

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
        const podsJobRunning = cloneDeep<TSPodList>(_podsJobRunning as any);
        const clusterState: ClusterState = {};

        gen(podsJobRunning, clusterState);
        gen(podsJobRunning, clusterState);

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

    it('should remove old host ips', () => {
        const podsJobRunning = cloneDeep<TSPodList>(_podsJobRunning as any);
        const clusterState: ClusterState = {};
        clusterState['2.2.2.2'] = {
            node_id: '2.2.2.2',
            hostname: '2.2.2.2',
            pid: 'N/A',
            node_version: 'N/A',
            teraslice_version: 'N/A',
            total: 'N/A',
            state: 'idk',
            available: 'N/A',
            active: []
        };

        gen(podsJobRunning, clusterState);
        expect(clusterState['192.168.99.100'].active.length).toEqual(3);
        expect(clusterState['2.2.2.2']).toBeUndefined();
    });
});
