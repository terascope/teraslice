'use strict';

function getTerasliceClient(cliConfig) {
    return require('teraslice-client-js')({ host: cliConfig.clusterUrl });
}

module.exports = {
    getTerasliceClient
};
