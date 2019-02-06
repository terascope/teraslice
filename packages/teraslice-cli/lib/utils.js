'use strict';

const _ = require('lodash');

function getTerasliceClient(cliConfig) {
    return require('teraslice-client-js')({ host: cliConfig.clusterUrl });
}

async function getTerasliceClusterType(terasliceClient) {
    let clusterInfo = {};
    let clusteringType = 'native';
    try {
        clusterInfo = await terasliceClient.cluster.info();
        if (_.has(clusterInfo, 'clustering_type')) {
            clusteringType = clusterInfo.clustering_type;
        } else {
            clusteringType = 'native';
        }
    } catch (err) {
        if (err.code === 405 && err.error === 405) {
            clusteringType = 'native';
        }
    }
    return clusteringType;
}

module.exports = {
    getTerasliceClient,
    getTerasliceClusterType
};
