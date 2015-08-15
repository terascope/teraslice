'use strict';
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));
var path = require('path');

var queue = require('../utils/queue');

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

function getFileNames(context, opConfig) {
    var logger = context.logger;
    logger.info("getting all file paths");

    walk(opConfig.path, function(filePath, rootDir, filename) {
        if (filename.charAt(0) !== '.') {
            queue.enqueue(filePath)
        }
    });

    logger.info("All file paths have been enqueued");
}


function newSlicer(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    getFileNames(context, opConfig);

    return function() {
        return queue.dequeue();
    }
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer
};