'use strict';

var worker = require('./lib/worker');
var master = require('./lib/master');

var foundation = require('terafoundation')({
    name: 'TeraSlice',
    worker: worker,
    master: master,
    prevent_worker_default: true
});
