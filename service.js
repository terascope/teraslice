'use strict';

var worker = require('./lib/cluster/worker');
var slicer = require('./lib/cluster/slicer');
var assets = require('./lib/cluster/assets');
var assets_service = require('./lib/cluster/services/assets')
var master = require('./lib/master');
var cluster_master = require('./lib/cluster/cluster_master');
var moderator = require('./lib/cluster/moderator');

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
    assets: assets,
    assets_service: assets_service,
    shutdownMessaging: true,
    cluster_master: cluster_master,
    moderator: moderator,
    descriptors: {
        slicer: true,
        worker: true,
        cluster_master: true,
        moderator: true,
        assets: true,
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
