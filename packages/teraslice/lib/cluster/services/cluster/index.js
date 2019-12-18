'use strict';

module.exports = function clustering(context, { clusterMasterServer }) {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return require('./backends/native')(context, clusterMasterServer);
    }

    if (clusterType === 'kubernetes') {
        return require('./backends/kubernetes')(context, clusterMasterServer);
    }

    throw new Error(`unknown cluster service ${clusterType}, cannot find cluster module`);
};
