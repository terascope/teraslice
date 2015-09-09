'use strict';
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var path = require('path');
var Queue = require('../utils/queue');

var fileQueue = new Queue;

function newReader(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    return function(msg) {
        var data = fs.readFileSync(msg, 'utf-8');
        return JSON.parse(data);
    }
}

function walk(rootDir, callback) {
    fs.readdirSync(rootDir).forEach(function(filename) {
        var filePath = path.join(rootDir, filename);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, callback);
        } else {
            callback(filePath, rootDir, filename);
        }
    });
}

function getFileNames(jobConfig, opConfig) {
    var logger = jobConfig.logger;
    logger.info("getting all file paths");

    walk(opConfig.path, function(filePath, rootDir, filename) {
        if (filename.charAt(0) !== '.') {
            fileQueue.enqueue(filePath)
        }
    });

    logger.info("All file paths have been enqueued");
}


function newSlicer(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    getFileNames(jobConfig, opConfig);

    return function() {
        return fileQueue.dequeue();
    }
}

function schema(){
    return {
        path: {
            doc: 'Path to where the directory is located to read from',
            default: null,
            format: 'required_String'
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    getFileNames: getFileNames,
    walk: walk
};