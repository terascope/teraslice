'use strict';

var events = require('events');
var Promise = require('bluebird');
var _ = require('lodash');

function create(customConfig, logger) {
    var hdfsClient = require('node-webhdfs').WebHDFSClient;

    var highAvailibility = false;
    var currentNameNode;

    if (Array.isArray(customConfig.namenode_host)) {
        currentNameNode = customConfig.namenode_host[0];
        customConfig.namenode_list = customConfig.namenode_host;
        highAvailibility = true;
    }
    else {
        currentNameNode = customConfig.namenode_host;
    }

    var config = _.assign({}, customConfig, {namenode_host: currentNameNode});
    var client = new hdfsClient(config);

    logger.info(`Using hdfs hosts: ${currentNameNode}, high-availability: ${highAvailibility}`);

    return {
        client: Promise.promisifyAll(client)
    }
}

function config_schema() {
    return {
        user: {
            doc: 'user type for hdfs requests',
            default: 'hdfs',
            format: String
        },
        namenode_port: {
            doc: 'port of hdfs',
            default: 50070
        },
        namenode_host: {
            doc: 'a single host, or multiple hosts listed in an array',
            default: null,
            format: function(val) {
                if (typeof val === 'string') {

                    return;
                }
                if (Array.isArray(val)) {
                    if (val.length < 2) {
                        throw new Error("namenode_host must have at least two namenodes listed in the array")
                    }
                    return;
                }
                throw new Error('namenode_host configuration must be set to an array for high availability or a string')
            }
        },
        path_prefix: {
            doc: 'endpoint for hdfs web interface',
            default: '/webhdfs/v1'
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};