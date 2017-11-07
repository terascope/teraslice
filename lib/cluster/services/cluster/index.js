'use strict';

module.exports = function module(context, messaging, executionService) {
    const clusterType = context.sysconfig.teraslice.cluster_manager_type;

    if (clusterType === 'native') {
        return require('./backends/native')(context, messaging, executionService);
    }

    if (clusterType === 'kubernetes') {
        return require('./backends/kubernetes')(context, messaging, executionService);
    }

    return Promise.reject(`unknown cluster service ${clusterType}, cannot find cluster module`);
};
