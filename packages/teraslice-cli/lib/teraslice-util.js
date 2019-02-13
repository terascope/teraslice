'use strict';

const _ = require('lodash');

class TerasliceUtil {
    constructor(cliConfig) {
        this.config = cliConfig;
    }

    get client() {
        return require('teraslice-client-js')({ host: this.config.clusterUrl });
    }

    async info() {
        return this.client.cluster.info();
    }

    async type() {
        let clusterInfo = {};
        let clusteringType = 'native';
        try {
            clusterInfo = await this.info();
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
}

module.exports = TerasliceUtil;
