'use strict';

var events = require('events');
var Promise = require('bluebird');
var _ = require('lodash');

function create(customConfig, logger) {
    var hdfsClient = require('node-webhdfs').WebHDFSClient;
    logger.info("Using hdfs hosts: " + customConfig.host);
    var client = new hdfsClient(customConfig);
    var currentNameNode = customConfig.namenode_host;

    function makeNewClient() {
        var list = customConfig.namenode_list;
        //we want the next spot
        var index = list.indexOf(currentNameNode) + 1;
        //if empty start from the beginning of the
        var nameNodeHost = list[index] ? list[index] : list[0];
        currentNameNode = nameNodeHost;
        var newClient = new hdfsClient(_.assign({}, customConfig, {namenode_host: nameNodeHost}));

        return {
            client: Promise.promisifyAll(newClient)
        }
    }

    return {
        client: Promise.promisifyAll(client),
        changeNameNode: makeNewClient
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