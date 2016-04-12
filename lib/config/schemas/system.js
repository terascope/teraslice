'use strict';
var exec = require('child_process').execSync;
var _ = require('lodash');


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
    master_hostname: {
        doc: 'hostname where the cluster_master resides, used to notify all node_masters where to connect',
        //TODO place a proper default here and checks
        default: 'required_String'
    },
    port: {
        doc: 'port for the cluster_master to listen on',
        default: 5678
    },
    name: {
        doc: 'Name for the cluster itself, its used for naming log files/indices',
        default: 'teracluster'
    },
    logs: {
        doc: 'Used to determine the elasticsearch connection to send log and state indices',
        default: {connection: 'default'}
    },
    timeout: {
        doc: 'time in milliseconds for waiting for a response when messaging node_master before throwing an error',
        default: 60000
    },
    slicer_port_range: {
        doc: 'range of ports that slicers will use per node',
        default: '45678:46678',
        format: function(val) {
            var arr = val.split(':');
            if (arr.length !== 2) {
                throw new Error('slicer_port_range is formatted incorrectly')
            }
            arr.forEach(function(value) {
                if (isNaN(value)) {
                    throw new Error('values specified in slicer_port_range must be a number specified as a string')
                }
            })

        }
    }
};


function config_schema(config) {
    var config = config;

    if (config.teraslice.cluster) {
        schema.cluster = clusterSchema;
    }

    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema
};
