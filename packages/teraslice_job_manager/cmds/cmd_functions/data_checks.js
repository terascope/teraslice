'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply')();

module.exports = (tjmConfig) => {
    function returnJobData() {
        // add job data to the tjmConfig object for easy reference
        jobFileHandler();
        // explicitly state the cluster that the code will reference for the job
        if (_.has(tjmConfig.job_file_content, 'tjm.cluster') && !tjmConfig.m) {
            tjmConfig.cluster = tjmConfig.job_file_content.tjm.cluster;
            return;
        }

        tjmConfig.cluster = tjmConfig.l ? 'http://localhost:5678' : _urlCheck(tjmConfig.c);

        if (!tjmConfig.cluster) {
            reply.fatal('Use -c to specify a cluster or use -l for localhost');
        }
    }

    function jobFileHandler() {
        let fName = tjmConfig.job_file;

        if (!fName) {
            reply.fatal('Missing the job file!');
        }

        if (fName.lastIndexOf('.json') !== fName.length - 5) {
            fName += '.json';
        }

        const jobFilePath = path.join(process.cwd(), fName);
        let jobContents;

        try {
            jobContents = require(jobFilePath);
        } catch (err) {
            reply.fatal(`Sorry, can't find the JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.fatal('JSON file contents cannot be empty');
        }

        // conflicting cluster information
        if (tjmConfig.c && !tjmConfig.m && _tjmDataCheck(jobContents)) {
            reply.fatal('Command specified a cluster via -c but the job is already associated with a cluster');
        }
        // no cluster specified
        if (!tjmConfig.c && !_tjmDataCheck(jobContents) && !tjmConfig.l) {
            reply.fatal('Please specify a cluster with -c');
        }
        // -m but no -c to move job to
        if (tjmConfig.m && !tjmConfig.c) {
            reply.fatal('Specify a cluster to move the jobe to with -c');
        }
        tjmConfig.job_file_path = jobFilePath;
        tjmConfig.job_file_content = jobContents;
    }

    function _tjmDataCheck(jsonData) {
        return (_.has(jsonData, 'tjm.clusters') || _.has(jsonData, 'tjm.cluster'));
    }

    function _urlCheck(url) {
        // check that url starts with http:// but allow for https://
        return url.indexOf('http') === -1 ? `http://${url}` : url;
    }

    function getAssetClusters() {
        if (tjmConfig.c) {
            const cluster = _urlCheck(tjmConfig.c);
            tjmConfig.cluster = cluster;
        }
        if (tjmConfig.l) {
            tjmConfig.cluster = 'http://localhost:5678';
        }
        if (!_.has(tjmConfig, 'cluster') && _.has(tjmConfig.asset_file_content, 'tjm.clusters')) {
            tjmConfig.clusters = tjmConfig.asset_file_content.tjm.clusters;
        }
        if (_.isEmpty(tjmConfig.clusters) && !_.has(tjmConfig, 'cluster')) {
            reply.fatal('Cluster data is missing from asset.json or not specified using -c.');
        }
    }
    return {
        returnJobData,
        jobFileHandler,
        getAssetClusters,
        _urlCheck,
        _tjmDataCheck
    };
};
