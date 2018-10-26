'use strict';

const _ = require('lodash');
const path = require('path');
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

    async function alreadyRegistered() {
        let registered = false;
        const jobContents = cliConfig.job_file_content;
        if (_.has(jobContents, '__metadata.cli.cluster')) {
            const jobSpec = await terasliceClient.jobs.wrap(jobContents.__metadata.cli.job_id).config();
            if (jobSpec.job_id === jobContents.__metadata.cli.job_id) {
                // return true for testing purposes
                reply.green(`${jobSpec.job_id} is registered`);
                registered = true;
            }
        }
        return registered;
    }

    return {
        getAssetClusters,
        alreadyRegistered,
        _dataCheck
    };
};
