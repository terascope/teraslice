'use strict';
var exec = require('child_process').execSync;
var _ = require('lodash');


function portError(port) {
    throw new Error('Port specified in config file (' + port + ') is already in use, please specify another')
}

function findPort(port, cb) {
    var command = 'lsof -i -P | grep -i ' + port;
    var results;

    try {
        results = exec(command, {encoding: 'utf8'});
    }
    catch (e) {
        return port;
    }

    if (results) {
        if (cb) {
            return cb(results)
        }
        return findPort(port + 1)
    }
}

var startingPort = findPort(45678);

var ip = _.chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .filter(function(val) {
        return (val.family == 'IPv4' && val.internal == false)
    })
    .pluck('address')
    .head()
    .value();


var schema = {
    ops_directory: {
        doc: '',
        default: __dirname + '/lib'
    },
    shutdown_timeout: {
        doc: '',
        default: 60
    },
    reporter: {
        doc: '',
        default: ''
    },
    port: {
        doc: 'Port for slicer',
        default: startingPort,
        format: function(port) {
            return findPort(port, portError)
        }
    },
    hostname: {
        doc: 'IP or hostname for server',
        default: ip
    }
};

var clusterSchema = {
    master: {
        doc: 'boolean for determining if cluster_master should live on this node',
        default: false
    },
    master_hostname:{
        doc: 'hostname where the cluster_master resides, used to notify all node_masters where to connect',
        //TODO place a proper default here and checks
        default: 'required_String'
    },
    port: {
        doc:'port for the cluster_master to listen on',
        default: 5678
    },
    name: {
        doc: 'Name for the cluster itself, its used for naming log files/indices',
        default: 'teracluster'
    },
    logs: {
        doc: 'Used to determine the elasticsearch connection to send log and state indices',
        default: {connection:'default'}
    },
    timeout: {
        doc: 'time in milliseconds for waiting for a response when messaging node_master before throwing an error',
        default: 60000
    }
};


function config_schema(config) {
    var config = config;

    if(config.teraslice.cluster){
        schema.cluster = clusterSchema;
    }

    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema,
    portError: portError,
    findPort: findPort
};
