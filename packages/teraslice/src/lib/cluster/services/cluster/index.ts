import type { Context } from '@terascope/job-components';
import { NativeClustering } from './backends/native';
import { KubernetesClusterBackend } from './backends/kubernetes';

export type ClusterServiceType = NativeClustering | KubernetesClusterBackend;

export function makeClustering(context: Context, { clusterMasterServer }: any): ClusterServiceType {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return new NativeClustering(context, clusterMasterServer);
    }

    if (clusterType === 'kubernetes') {
        return new KubernetesClusterBackend(context, clusterMasterServer);
    }

    throw new Error(`unknown cluster service ${clusterType}, cannot find cluster module`);
}
