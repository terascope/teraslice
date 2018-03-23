'use strict';

module.exports = function module(context, messaging, executionService) {
    const { cluster_manager_type: clusterType } = context.sysconfig.teraslice;

    if (clusterType === 'native') {
        return require('./backends/native')(context, messaging, executionService);
    }

    if (clusterType === 'kubernetes') {
        return require('./backends/kubernetes')(context, messaging, executionService);
    }

    return Promise.reject(`unknown cluster service ${clusterType}, cannot find cluster module`);
};
