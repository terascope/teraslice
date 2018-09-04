'use strict';

// TODO make messaging worker with clusterMasterServer
module.exports = function module(context, clusterMasterServer, executionService) {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return require('./backends/native')(context, clusterMasterServer, executionService);
    }

    if (clusterType === 'kubernetes') {
        return require('./backends/kubernetes')(context, clusterMasterServer, executionService);
    }

    return Promise.reject(new Error(`unknown cluster service ${clusterType}, cannot find cluster module`));
};
