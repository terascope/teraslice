'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply');

module.exports = (cliConfig = {}) => {
    if (!cliConfig.baseDir) {
        cliConfig.baseDir = process.cwd();
    }
    function returnJobData() {
        // add job data to the cliConfig object for easy reference
        jobFileHandler();
        // explicitly state the cluster that the code will reference for the job
        if (_.has(cliConfig.job_file_content, 'tjm.cluster') && !cliConfig.m) {
            cliConfig.cluster = cliConfig.job_file_content.tjm.cluster;
            return;
        }

        cliConfig.cluster = cliConfig.l ? 'http://localhost:5678' : _urlCheck(cliConfig.c);

        if (!cliConfig.cluster) {
            reply.fatal('Use -c to specify a cluster or use -l for localhost');
        }
    }

    function jobFileHandler() {
        let fName = cliConfig.job_file;

        if (!fName) {
            reply.fatal('Missing the job file!');
        }

        if (fName.lastIndexOf('.json') !== fName.length - 5) {
            fName += '.json';
        }

        const jobFilePath = path.isAbsolute(fName) ? fName : path.join(cliConfig.baseDir, fName);
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
        if (cliConfig.c && !cliConfig.m && _tjmDataCheck(jobContents)) {
            reply.fatal('Command specified a cluster via -c but the job is already associated with a cluster');
        }
        // no cluster specified
        if (!cliConfig.c && !_tjmDataCheck(jobContents) && !cliConfig.l) {
            reply.fatal('Please specify a cluster with -c');
        }
        // -m but no -c to move job to
        if (cliConfig.m && !cliConfig.c) {
            reply.fatal('Specify a cluster to move the jobe to with -c');
        }
        cliConfig.job_file_path = jobFilePath;
        cliConfig.job_file_content = jobContents;
    }

    function _tjmDataCheck(jsonData) {
        return (_.has(jsonData, 'tjm.clusters') || _.has(jsonData, 'tjm.cluster'));
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
        if (!_.has(cliConfig, 'cluster') && _.has(cliConfig, 'asset_file_content.tjm.clusters')) {
            cliConfig.clusters = _.filter(_.get(cliConfig, 'asset_file_content.tjm.clusters', []));
        }
        if (_.isEmpty(cliConfig.clusters) && !_.has(cliConfig, 'cluster')) {
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
