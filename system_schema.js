'use strict';
var exec = require('child_process').execSync;
var _ = require('lodash');


function portError(port){

    throw new Error('Port specified in config file (', port, ') is already in use, please specify another')
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

var startingPort = findPort(5678);

var ip = _.chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .filter(function(val){
        return (val.family == 'IPv4' && val.internal == false)
    })
    .pluck('address')
    .head()
    .value();


var schema = {
    teraslice_ops_directory: {
        doc: '',
        default: '/Users/jarednoble/Desktop/fakeOps'
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
        format: function(port){
            return findPort(port, portError)
        }
    },
    hostname: {
        doc: 'IP or hostname where slicer resides',
        default: ip
    }
};


function config_schema(config) {
    var config = config;
    //TODO do something with config if needed

    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema,
    portError: portError,
    findPort: findPort
};
