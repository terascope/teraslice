import { NativeClustering } from './backends/native';
import { KubernetesClusterBackend } from './backends/kubernetes';
import { ClusterMasterContext } from '../../../../interfaces';

export type ClusterServiceType = NativeClustering | KubernetesClusterBackend;

export function makeClustering(
    context: ClusterMasterContext,
    { clusterMasterServer }: any
): ClusterServiceType {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return new NativeClustering(context, clusterMasterServer);
    }

    if (clusterType === 'kubernetes') {
        return new KubernetesClusterBackend(context, clusterMasterServer);
    }

    throw new Error(`unknown cluster service ${clusterType}, cannot find cluster module`);
}
