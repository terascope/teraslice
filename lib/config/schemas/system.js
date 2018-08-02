'use strict';

const _ = require('lodash');
const path = require('path');

const ip = _.chain(require('os').networkInterfaces())
    .values()
    .flatten()
    .filter(val => (val.family === 'IPv4' && val.internal === false))
    .map('address')
    .head()
    .value();

const workerCount = require('os').cpus().length;

const schema = {
    ops_directory: {
        doc: 'directory to look for more readers and processors',
        default: path.join(__dirname, '/lib'),
        format: 'optional_String'
    },
    assets_directory: {
        doc: 'directory to look for assets',
        default: path.join(__dirname, '../../../assets'),
        format: 'optional_String'
    },
    shutdown_timeout: {
        doc: 'time in milliseconds, to allow workers and slicers to finish operations before forcefully shutting down',
        default: 60000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('shutdown_timeout parameter for teraslice must be a number');
            } else if (val < 0) {
                throw new Error('shutdown_timeout parameter for teraslice must be a positive number');
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
        format(val) {
            if (isNaN(val)) {
                throw new Error('workers parameter for teraslice must be a number');
            } else if (val < 0) {
                throw new Error('workers for teraslice must be >= zero');
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
        default: { connection: 'default' },
        format(val) {
            if (!val.connection) {
                throw new Error('state parameter must be an object with a key named "connection"');
            }
            if (typeof val.connection !== 'string') {
                throw new Error('state parameter object with a key "connection" must be of type String as the value');
            }
        }
    },
    action_timeout: {
        doc: 'time in milliseconds for waiting for a action ( pause/stop job, etc) to complete before throwing an error',
        default: 300000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('action_timeout parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('action_timeout parameter for teraslice must be greater than zero');
            }
        }
    },
    network_latency_buffer: {
        doc: 'time in milliseconds buffer which is combined with action_timeout to determine how long the cluster master will wait till it throws an error',
        default: 15000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('network_latency_buffer parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('network_latency_buffer parameter for teraslice must be greater than zero');
            }
        }
    },
    slicer_timeout: {
        doc: 'time in milliseconds that the slicer will wait for worker connection before terminating the job',
        default: 180000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('timeout parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('timeout parameter for teraslice must be greater than zero');
            }
        }
    },
    slicer_allocation_attempts: {
        doc: 'The number of times a slicer will try to be allocated before failing',
        default: 3,
        format(val) {
            if (isNaN(val)) {
                throw new Error('slicer_allocation_attempts parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('slicer_allocation_attempts parameter for teraslice must be greater than zero');
            }
        }
    },
    node_state_interval: {
        doc: 'time in milliseconds that indicates when the cluster master will ping nodes for their state',
        default: 5000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('node_state_interval parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('node_state_interval parameter for teraslice must be greater than zero');
            }
        }
    },
    node_disconnect_timeout: {
        doc: 'time in milliseconds that the cluster  will wait untill it drops that node from state and attempts to provision the lost workers',
        default: 300000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('node_disconnect_timeout parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('node_disconnect_timeout parameter for teraslice must be greater than zero');
            }
        }
    },
    worker_disconnect_timeout: {
        doc: 'time in milliseconds that the slicer will wait after all workers have disconnected before terminating the job',
        default: 300000,
        format(val) {
            if (isNaN(val)) {
                throw new Error('worker_disconnect_timeout parameter for teraslice must be a number');
            } else if (val <= 0) {
                throw new Error('worker_disconnect_timeout parameter for teraslice must be greater than zero');
            }
        }
    },
    slicer_port_range: {
        doc: 'range of ports that slicers will use per node',
        default: '45679:46678',
        format(val) {
            const arr = val.split(':');
            if (arr.length !== 2) {
                throw new Error('slicer_port_range is formatted incorrectly');
            }
            arr.forEach((value) => {
                if (isNaN(value)) {
                    throw new Error('values specified in slicer_port_range must be a number specified as a string');
                }
            });
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
    },
    index_rollover_frequency: {
        state: {
            doc: 'How frequently the teraslice state indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        },
        analytics: {
            doc: 'How frequently the analytics indices are created',
            default: 'monthly',
            format: ['daily', 'monthly', 'yearly']
        }
    },
    cluster_manager_type: {
        doc: 'determines which cluster system should be used',
        default: 'native',
        format: ['native', 'kubernetes']
    },
    kubernetes_image: {
        doc: 'Specify a custom image name for kubernetes, this only applies to kubernetes systems',
        default: 'terascope/teraslice',
        format: 'optional_String'
    },
    kubernetes_namespace: {
        doc: 'Specify a custom kubernetes namespace, this only applies to kubernetes systems',
        default: 'default',
        format: 'optional_String'
    }
};


function configSchema() {
    return { teraslice: schema };
}

module.exports = {
    config_schema: configSchema,
    schema
};
