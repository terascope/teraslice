'use strict';
var _ = require('lodash');
var path = require('path');

var ip = _.chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .filter(function(val) {
        return (val.family == 'IPv4' && val.internal == false)
    })
    .map('address')
    .head()
    .value();

var workerCount = require('os').cpus().length;

var schema = {
    ops_directory: {
        doc: 'directory to look for more readers and processors',
        default: path.join(__dirname, '/lib'),
        format: 'optional_String'
    },
    assets_directory: {
        doc: 'directory to look for assets',
        default: path.join(__dirname , '../../../assets'),
        format: 'optional_String'
    },
    shutdown_timeout: {
        doc: 'time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down',
        default: 60000,
        format: function(val) {
            if (isNaN(val)) {
                throw new Error('shutdown_timeout parameter for teraslice must be a number')
            }
            else {
                if (val < 0) {
                    throw new Error('shutdown_timeout parameter for teraslice must be a positive number')
                }
            }
        }
    },
    reporter: {
        doc: 'not currently operational ',
        default: ''
    },
    hostname: {
        doc: 'IP or hostname for server',
        default: ip,
        format: 'required_String'
    },
    workers: {
        doc: 'Number of workers per server',
        default: workerCount,
        format: function(val) {
            if (isNaN(val)) {
                throw new Error('workers parameter for teraslice must be a number')
            }
            else {
                if (val < 0) {
                    throw new Error('workers for teraslice must be >= zero')
                }
            }
        }
    },
    master: {
        doc: 'boolean for determining if cluster_master should live on this node',
        default: false,
        format: Boolean
    },
    master_hostname: {
        doc: 'hostname where the cluster_master resides, used to notify all node_masters where to connect',
        default: 'localhost',
        format: 'required_String'
    },
    port: {
        doc: 'port for the cluster_master to listen on',
        default: 5678,
        format: 'port'
    },
    name: {
        doc: 'Name for the cluster itself, its used for naming log files/indices',
        default: 'teracluster',
        format: 'required_String'
    },
    state: {
        doc: 'Elasticsearch cluster where job state, analytics and logs are stored',
        default: {connection: 'default'},
        format: function(val) {
            if (!val.connection) {
                throw new Error('state parameter must be an object with a key named "connection"')
            }
            if (typeof val.connection !== 'string') {
                throw new Error('state parameter object with a key "connection" must be of type String as the value')
            }
        }
    },
    timeout: {
        doc: 'time in milliseconds for waiting for a response when messaging node_master before throwing an error',
        default: 300000,
        format: function(val) {
            if (isNaN(val)) {
                throw new Error('timeout parameter for teraslice must be a number')
            }
            else {
                if (val <= 0) {
                    throw new Error('timeout parameter for teraslice must be greater than zero')
                }
            }
        }
    },
    slicer_timeout: {
        doc: 'time in milliseconds that the slicer will wait for worker connection before terminating the job',
        default: 180000,
        format: function(val) {
            if (isNaN(val)) {
                throw new Error('timeout parameter for teraslice must be a number')
            }
            else {
                if (val <= 0) {
                    throw new Error('timeout parameter for teraslice must be greater than zero')
                }
            }
        }
    },
    slicer_port_range: {
        doc: 'range of ports that slicers will use per node',
        default: '45679:46678',
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
    },
    analytics_rate: {
        doc: 'Rate in ms in which to push analytics to cluster master',
        default: 60000,
        format: Number
    },
    moderator: {
        doc: 'boolean for determining if moderator should live on this node',
        default: false,
        format: Boolean
    },
    moderator_limit: {
        doc: 'percentage limit (decimal form) of elasticsearch queue.length/threshold that the moderator will issue a pause event',
        default: 0.85,
        format: Number
    },
    moderator_resume: {
        doc: 'percentage limit (decimal form) of elasticsearch queue.length/threshold that the moderator will issue a resume event on previously paused jobs by the moderator',
        default: 0.5,
        format: Number
    },
    moderator_interval: {
        doc: 'Interval in ms in which the moderator checks the database',
        default: 10000,
        format: Number
    }
};


function config_schema(config) {
    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema
};
