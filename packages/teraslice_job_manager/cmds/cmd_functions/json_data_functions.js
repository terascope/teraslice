'use strict';

const _ = require('lodash');
const reply = require('./reply')();

module.exports = (fileName, asset) => {
    function jobFileHandler() {
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
        const jobFilePath = `${process.cwd()}/${fName}`;
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

    function metaDataCheck(fileJson) {
        if (!_.has(fileJson, 'tjm')) {
            reply.error('No teraslice job manager metadata, register the job or deploy the assets');
        }
    }

    return {
        jobFileHandler,
        metaDataCheck
    };
};
