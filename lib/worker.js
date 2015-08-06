'use strict';

var Promise = require('bluebird');
var jobs = require('../jobs');

module.exports = function (context) {
    var cluster = context.cluster;
    var logger = context.logger;

    var initializeJob = require('./utils/config').initializeJob;

    var code = initializeJob(context, jobs);

    var reader = code.reader;
    var processor = code.processors;
    var sender = code.sender;

    var queue = code.queue;

    function isReady(res, msg) {
        //res may return null if no data was received
        if (res && res.errors) {
            logger.error(res.items)
        }
        else {
            logger.info('Worker: ' + cluster.worker.id + ' , pid: ' + process.pid + ' has processed: ' + msg.start +
                ' : ' + msg.end);
            process.send({msg: 'finished', id: cluster.worker.id});
        }
    }

    function catchError(err) {
        //TODO handle errors
        console.log('this is an error', err);
    }

    function runSlice(msg) {
        var msg = msg;
        var p = Promise.resolve(msg);
        var res = queue.reduce(function(prev, fn) {
            return prev = prev.then(fn, catchError);
        }, p);

        return Promise.resolve(res).then(function(data) {
            isReady(data, msg)
        });
    }

    //set up listener
    process.on('message', function (msg) {

        if (msg.message === 'data') {
            runSlice(msg.data);
        }
        else {
            process.send({msg: 'finished', id: cluster.worker.id});
        }
    });
};