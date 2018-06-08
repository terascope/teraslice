'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('./reply')();

module.exports = () => {
    function jobFileHandler(fileName, asset) {
        let fName = fileName;

        if (!fName) {
            reply.fatal('Missing the job file!');
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
            reply.fatal(`Sorry, can't find the JSON file: ${fName}`);
        }

        if (_.isEmpty(jobContents)) {
            reply.fatal('JSON file contents cannot be empty');
        }

        return [jobFilePath, jobContents];
    }

    function metaDataCheck(jsonData) {
        if (!(_.has(jsonData, 'tjm.clusters') || _.has(jsonData, 'tjm.cluster'))) {
            reply.fatal('No teraslice job manager metadata, register the job or deploy the assets');
        }
        return true;
    }

    function getClusters(jsonData) {
        if (_.has(jsonData, 'tjm.clusters')) {
            return _.get(jsonData, 'tjm.clusters');
        }
        if (_.has(jsonData, 'tjm.clusters')) {
            return _.castArray(_.get(jsonData, 'tjm.cluster'));
        }
        return [];
    }

    return {
        jobFileHandler,
        metaDataCheck,
        getClusters
    };
};
