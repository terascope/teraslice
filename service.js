'use strict';

var worker = require('./lib/cluster/worker');
var slicer = require('./lib/cluster/slicer');
var assets_loader = require('./lib/cluster/assets');
var assets_service = require('./lib/cluster/services/assets');
var master = require('./lib/master');
var moderator = require('./lib/cluster/moderator');
var jobs_service = require('./lib/cluster/services/jobs');
var api_service = require('./lib/cluster/services/api');
var cluster_service = require('./lib/cluster/services/cluster');

var config_schema = require('./lib/config/schemas/system').config_schema;
var emitter = require('./lib/utils/events');
var schema_formats = require('./lib/utils/convict_utils');

function ops_directory(configFile) {
    if (configFile.teraslice && configFile.teraslice.ops_directory) {
        return configFile.teraslice.ops_directory;
    }
}

function cluster_name(configFile) {
    if (configFile.teraslice && configFile.teraslice.name) {
        return configFile.teraslice.name
    }
}

function logging_connection(configFile) {
    if (configFile.teraslice && configFile.teraslice.state) {
        return configFile.teraslice.state.connection;
    }
    else {
        return 'default';
    }
}

var foundation = require('terafoundation')({
    name: 'teraslice',
    worker: worker,
    master: master,
    slicer: slicer,
    assets_loader: assets_loader,
    assets_service: assets_service,
    shutdownMessaging: true,
    api_service: api_service,
    cluster_service: cluster_service,
    jobs_service: jobs_service,
    moderator: moderator,
    descriptors: {
        slicer: true,
        worker: true,
        api_service: true,
        cluster_service: true,
        jobs_service: true,
        moderator: true,
        assets_loader: true,
        assets_service: true
    },
    start_workers: false,
    config_schema: config_schema,
    schema_formats: schema_formats,
    ops_directory: ops_directory,
    cluster_name: cluster_name,
    logging_connection: logging_connection
    // emitter: emitter
});
