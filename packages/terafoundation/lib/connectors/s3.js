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
            region: {
                doc: '',
                default: 'us-east-1',
                format: String
            },
            maxRetries: {
                doc: '',
                default: 3,
                format: Number
            },
            maxRedirects: {
                doc: '',
                default: 10,
                format: Number
            },
            sslEnabled: {
                doc: '',
                default: true,
                format: Boolean
            },
            s3ForcePathStyle: {
                doc: '',
                default: false,
                format: Boolean
            },
            s3BucketEndpoint: {
                doc: '',
                default: false,
                format: Boolean
            }
        };
    }
};
