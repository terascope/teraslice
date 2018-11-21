'use strict';

const _ = require('lodash');
const reply = require('./reply')();

module.exports = (cliConfig) => {
    const terasliceClient = require('teraslice-client-js')({
        host: cliConfig.cluster_url
    });

    function _dataCheck(jsonData) {
        return (_.has(jsonData, 'cli.clusters') || _.has(jsonData, 'cli.cluster'));
    }

    function _urlCheck(url) {
        // check that url starts with http:// but allow for https://
        return url.indexOf('http') === -1 ? `http://${url}` : url;
    }

    function getAssetClusters() {
        if (cliConfig.c) {
            cliConfig.cluster = _urlCheck(cliConfig.c);
        }
        if (cliConfig.l) {
            cliConfig.cluster = 'http://localhost:5678';
        }
        if (!_.has(cliConfig, 'cluster') && _.has(cliConfig, 'asset_file_content.cli.clusters')) {
            cliConfig.clusters = _.filter(_.get(cliConfig, 'asset_file_content.cli.clusters', []));
        }
        if (_.isEmpty(cliConfig.clusters) && !_.has(cliConfig, 'cluster')) {
            reply.fatal('Cluster data is missing from asset.json or not specified using -c.');
        }
    }

    async function alreadyRegistered(show = true) {
        let registered = false;
        const jobContents = cliConfig.job_file_content;
        if (_.has(jobContents, '__metadata.cli.cluster')) {
            const jobId = jobContents.__metadata.cli.job_id;
            const jobSpec = await terasliceClient.jobs.wrap(jobId).config();
            if (jobSpec.job_id === jobContents.__metadata.cli.job_id) {
                // return true for testing purposes
                if (show) {
                    reply.green(`${jobSpec.job_id} is registered`);
                }
                registered = true;
            } else {
                reply.error(`${jobSpec.job_id} is not registered`);
            }
        }
        return registered;
    }

    async function getClusteringType() {
        let clusterInfo = {};
        try {
            clusterInfo = await terasliceClient.cluster.info();
            if (_.has(clusterInfo, 'clustering_type')) {
                cliConfig.cluster_manager_type = clusterInfo.clustering_type;
            } else {
                cliConfig.cluster_manager_type = 'native';
            }
        } catch (err) {
            if (err.code === 405 && err.error === 405) {
                cliConfig.cluster_manager_type = 'native';
            }
        }
    }

    function matchId(specId, responseId) {
        let includeId = false;
        if (specId === undefined || responseId.job_id === specId || responseId.ex_id === specId) {
            includeId = true;
        }
        return includeId;
    }

    function validId(str) {
        let isId = false;
        let dashCount = 0;
        let pos = str.indexOf('-');
        while (pos !== -1) {
            dashCount += 1;
            pos = str.indexOf('-', pos + 1);
        }
        if (dashCount === 4 && str.length === 36) {
            isId = true;
        }
        return (isId);
    }


    return {
        getAssetClusters,
        getClusteringType,
        alreadyRegistered,
        _dataCheck,
        validId,
        matchId
    };
};
