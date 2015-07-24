'use strict';

var worker = require('./lib/worker');

// This just defines some initialization hooks
var master = require('./lib/master');

var foundation = require('terafoundation')({
    name: 'TeraSlice',
    //mongodb: ['default'],
    elasticsearch: ['default'],
    //redis: ['default', 'immediate'],
    worker: worker,
    master: master
});