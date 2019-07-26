'use strict';

const Promise = require('bluebird');


function create(customConfig, logger) {
    const AWS = require('aws-sdk');

    logger.info(`Using S3 endpoint: ${customConfig.endpoint}`);

    customConfig.defer = function _defer() {
        return Promise.defer();
    };

    const client = new AWS.S3(customConfig);

    return {
        client: Promise.promisifyAll(client, { suffix: '_Async' })
    };
}

module.exports = {
    create,
    config_schema() {
        return {
            endpoint: {
                doc: 'Target S3 endpoint',
                default: '127.0.0.1:80'
            },
            accessKeyId: {
                doc: '',
                default: null,
                format: String
            },
            secretAccessKey: {
                doc: '',
                default: null,
                format: String
            },
            maxRetries: {
                default: '3'
            }
        };
    }
};
