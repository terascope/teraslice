'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply')();

module.exports = (cliConfig) => {
    function read() {
        // add job data to the cliConfig object for easy reference
        handler();
        // explicitly state the cluster that the code will reference for the job
        // TODO, move to config??
        if (_.has(cliConfig.job_file_content, '__metadata.cli.cluster') && !cliConfig.m) {
            cliConfig.cluster = cliConfig.job_file_content.__metadata.cli.cluster;
            return;
        }
    }

    function handler() {
        const fName = cliConfig.deets.file;
        if (!fName) {
            reply.fatal('Missing the job file!');
        }

        const jobFilePath = path.isAbsolute(fName) ? fName : path.join(cliConfig.baseDir, fName);
        let jobContents;
        try {
            jobContents = require(jobFilePath);
        } catch (err) {
            console.log(err);
            reply.fatal(`Error reading JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.fatal('JSON file contents cannot be empty');
        }

        // conflicting cluster information
        // todo changed cliConfg.c to cliConfig.cluster_url
        if (cliConfig.cluster_url && !cliConfig.m && _dataCheck(jobContents)) {
            reply.fatal('Command specified a cluster via -c but the job is already associated with a cluster');
        }
        // no cluster specified
        if (!cliConfig.c && !_dataCheck(jobContents) && !cliConfig.l) {
            reply.fatal('Please specify a cluster with -c');
        }
        // -m but no -c to move job to
        if (cliConfig.m && !cliConfig.c) {
            reply.fatal('Specify a cluster to move the job to with -c');
        }
        cliConfig.job_file_path = jobFilePath;
        cliConfig.job_file_content = jobContents;
    }

    function _dataCheck(jsonData) {
        return (_.has(jsonData, '___metadata.cli.clusters') || _.has(jsonData, '___metadata.cli.cluster'));
    }

    function _urlCheck(url) {
        // check that url starts with http:// but allow for https://
        return url.indexOf('http') === -1 ? `http://${url}` : url;
    }

    return {
        read,
        handler,
        _urlCheck,
        _dataCheck
    };
};
