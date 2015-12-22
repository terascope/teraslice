'use strict';

var worker = require('./lib/worker');
var slicer = require('./lib/slicer');
var master = require('./lib/master');
var cluster_master = require('./lib/cluster/cluster_master');
var config_schema = require('./system_schema').config_schema;
var emitter = require('./lib/utils/events');


 var foundation = require('terafoundation')({
 name: 'teraslice',
 worker: worker,
 master: master,
 slicer: slicer,
 shutdownMessaging: true,
 cluster_master: cluster_master,
 descriptors: {slicer: true, worker: true, cluster_master: true},
 start_workers: false,
 config_schema: config_schema
 // emitter: emitter
 });

