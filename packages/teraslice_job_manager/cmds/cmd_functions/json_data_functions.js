'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply')();

module.exports = () => {
    function jobFileHandler(fileName, asset) {
        let fName = fileName;

        if (!fName) {
            reply.error('Missing the job file!');
        }

        if (fName.lastIndexOf('.json') !== fName.length - 5) {
            fName += '.json';
        }

        if (asset) {
            fName = `asset/${fileName}`;
        }
        const jobFilePath = path.join(process.cwd(), fName);
        let jobContents;

        try {
            jobContents = require(jobFilePath);
        } catch (err) {
            reply.error(`Sorry, can't find the JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.error('JSON file contents cannot be empty');
        }

        return [jobFilePath, jobContents];
    }

    function metaDataCheck(jsonData) {
        if (!(_.has(jsonData, 'tjm.clusters') || _.has(jsonData, 'tjm.cluster'))) {
            reply.error('No teraslice job manager metadata, register the job or deploy the assets');
        }
        return true;
    }

    return {
        jobFileHandler,
        metaDataCheck
    };
};
