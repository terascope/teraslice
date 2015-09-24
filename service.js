'use strict';

var worker = require('./lib/worker');
var master = require('./lib/master');
var config_schema = require('./system_schema').config_schema;

var foundation = require('terafoundation')({
    name: 'teraslice',
    worker: worker,
    master: master,
    start_workers: false,
    config_schema: config_schema
});
