'use strict';

var worker = require('./lib/worker');
var master = require('./lib/master');

var foundation = require('terafoundation')({
    name: 'TeraSlice',
    //mongodb: ['default'],
    elasticsearch: ['default'],
    //redis: ['default', 'immediate'],
    worker: worker,
    master: master
});