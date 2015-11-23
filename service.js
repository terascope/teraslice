'use strict';

var worker = require('./lib/worker');
var master = require('./lib/master');
var slicer = require('./lib/distributed/slicer');
var config_schema = require('./system_schema').config_schema;

var foundation = require('terafoundation')({
    name: 'teraslice',
    worker: worker,
    master: master,
    slicer: slicer,
    descriptors: {slicer: true, worker: true},
    start_workers: false,
    config_schema: config_schema
});

//"2015-08-25T23:55:00",