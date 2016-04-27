'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var Queue = require('../utils/queue');
var getFileNames = require('../utils/file_utils').getFileNames;

var fileQueue = new Queue;

function newReader(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    return function(msg) {
        var data = fs.readFileSync(msg, 'utf-8');
        return JSON.parse(data);
    }
}

function newSlicer(context, job, retryData) {
    var opConfig = job.readerConfig;
    var jobConfig = job.jobConfig;
    var slicers = [];
    //TODO review performance implications
    getFileNames(jobConfig, opConfig, fileQueue);

    slicers.push(function() {return fileQueue.dequeue()});

    return Promise.resolve(slicers)
}

function schema() {
    return {
        path: {
            doc: 'Path to where the directory is located to read from',
            default: null,
            format: 'required_String'
        }
    };
}

var parallelSlicers = false;

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};