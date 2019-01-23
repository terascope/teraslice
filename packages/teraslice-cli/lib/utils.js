'use strict';

function getTerasliceClient(cliConfig) {
    return require('teraslice-client-js')({ host: cliConfig.clusterUrl });
}

function getTerasliceClientByCluster(cluster) {
    return require('teraslice-client-js')({ host: cluster });
}

module.exports = {
    getTerasliceClient,
    getTerasliceClientByCluster
};
