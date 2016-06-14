'use strict';

var worker = require('./lib/cluster/worker');
var slicer = require('./lib/cluster/slicer');
var master = require('./lib/master');
var cluster_master = require('./lib/cluster/cluster_master');
var config_schema = require('./lib/config/schemas/system').config_schema;
var emitter = require('./lib/utils/events');
var schema_formats = require('./lib/utils/convict_utils');

var foundation = require('terafoundation')({
    name: 'teraslice',
    worker: worker,
    master: master,
    slicer: slicer,
    shutdownMessaging: true,
    cluster_master: cluster_master,
    descriptors: {slicer: true, worker: true, cluster_master: true},
    start_workers: false,
    config_schema: config_schema,
    schema_formats: schema_formats
    // emitter: emitter
});
