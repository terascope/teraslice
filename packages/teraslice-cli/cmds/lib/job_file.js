'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply')();

module.exports = (cliConfig) => {
    function read(check = true) {
        const fName = cliConfig.job_file;
        if (!fName) {
            reply.fatal('Missing the job file!');
        }

        const jobFilePath = path.isAbsolute(fName) ? fName : path.join(cliConfig.baseDir, fName);
        let jobContents;
        try {
            jobContents = require(jobFilePath);
        } catch (err) {
            reply.fatal(`Error reading JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.fatal('JSON file contents cannot be empty');
        }

        if (check) {
            if (_metadataCheck(jobContents)) {
                cliConfig.job_file_path = jobFilePath;
                cliConfig.job_file_content = jobContents;
            }
        } else {
            cliConfig.job_file_path = jobFilePath;
            cliConfig.job_file_content = jobContents;
        }
    }

    function _metadataCheck(jsonData) {
        return (_.has(jsonData, '__metadata.cli.clusters') || _.has(jsonData, '__metadata.cli.cluster'));
    }

    function _urlCheck(url) {
        // check that url starts with http:// but allow for https://
        return url.indexOf('http') === -1 ? `http://${url}` : url;
    }

    return {
        read,
        _urlCheck,
        _metadataCheck
    };
};
