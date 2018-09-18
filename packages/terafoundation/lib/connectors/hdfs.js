'use strict';

const events = require('events');

function create(customConfig, logger) {
    const hdfsClient = require('node-webhdfs').WebHDFSClient;
    logger.info(`Using hdfs hosts: ${customConfig.host}`);

    // TODO: there's no error handling here at all???
    const client = new hdfsClient(customConfig);

    return {
        client
    };
}

function config_schema() {
    return {
        user: {
            doc: '',
            default: 'webuser'
        },
        namenode_port: {
            doc: '',
            default: 50070
        },
        namenode_host: {
            doc: '',
            default: 'localhost'
        },
        path_prefix: {
            doc: '',
            default: '/webhdfs/v1'
        }
    };
}

module.exports = {
    create,
    config_schema
};
