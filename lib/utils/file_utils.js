'use strict';

var fs = require('fs');
var path = require('path');

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

function getFileNames(jobConfig, opConfig, fileQueue) {
    var logger = jobConfig.logger;
    logger.info("getting all file paths");

    walk(opConfig.path, function(filePath, rootDir, filename) {
        if (filename.charAt(0) !== '.') {
            fileQueue.enqueue(filePath)
        }
    });

    logger.info("All file paths have been enqueued");
}

module.exports = {
    walk: walk,
    getFileNames: getFileNames
};