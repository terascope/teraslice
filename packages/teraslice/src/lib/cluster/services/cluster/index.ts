import { NativeClustering } from './backends/native/index.js';
import { KubernetesClusterBackendV2 } from './backends/kubernetesV2/index.js';
import { ClusterMasterContext } from '../../../../interfaces.js';

export type ClusterServiceType
    = NativeClustering | KubernetesClusterBackendV2;

export function makeClustering(
    context: ClusterMasterContext,
    { clusterMasterServer }: any
): ClusterServiceType {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return new NativeClustering(context, clusterMasterServer);
    }

    if (clusterType === 'kubernetesV2') {
        return new KubernetesClusterBackendV2(context, clusterMasterServer);
    }

    throw new Error(`unknown cluster service ${clusterType}, cannot find cluster module`);
}
