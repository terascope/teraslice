'use strict';

var events = require('events');

function create(customConfig, logger) {
    var hdfsClient = require('node-webhdfs').WebHDFSClient;
    logger.info("Using hdfs hosts: " + customConfig.host);

    // TODO: there's no error handling here at all???
    var client = new hdfsClient(customConfig);

    return {
        client: client
    }
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
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};