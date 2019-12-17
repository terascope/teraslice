'use strict';

module.exports = async function clustering(context, clusterMasterServer, executionService) {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return require('./backends/native')(context, clusterMasterServer, executionService);
    }

    if (clusterType === 'kubernetes') {
        return require('./backends/kubernetes')(context, clusterMasterServer, executionService);
    }

    throw new Error(`unknown cluster service ${clusterType}, cannot find cluster module`);
};
