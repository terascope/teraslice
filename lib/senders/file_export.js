'use strict';
var moment = require('moment');
var processInterval = require('../readers/elastic_utils').processInterval;
var fs = require('fs');
var convict = require('convict');


//caching directories by interval specified in reader
var dirs = {};

function newSender(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

// TODO: currently making dirs by date, need to allow other means
    makeFolders(context, opConfig, jobConfig);

    return function(data, msg) {
        var path = parsePath(opConfig.path);

        var filePath;
        var transformData = processData(data, opConfig);

        //if msg is by date
        if (msg.start) {
            if (dirs[msg.start]) {
                filePath = path + msg.start + '/' + msg.start;
                return fs.writeFile(filePath, transformData)
            }
            else {
                filePath = path + findDir(path, msg) + '/' + msg.start;
                return fs.writeFile(filePath, transformData)
            }
        }
        else {
            //TODO save to disk by some other factor besides date
        }
    }
}

function processData(data, op) {
    if (op.elastic_metadata === undefined) {
        return JSON.stringify(data);
    }
    else {
        if (op.elastic_metadata) {
            return JSON.stringify(data.hits.hits);
        }
        else {
            var finalData = data.hits.hits.map(function(obj) {
                return obj._source;
            });

            return JSON.stringify(finalData);
        }
    }
}

function findDir(path, date) {
    var dirsArray = fs.readdirSync(path);
    var dateStart = new Date(date.start);

    for (var i = 0; i < dirsArray.length; i++) {
        var dirDate = new Date(dirsArray[i]);
        if (dirsArray[i + 1]) {
            var nextDir = new Date(dirsArray[i + 1]);

            if (dirDate < dateStart && dateStart < nextDir) {
                return dirsArray[i];
            }
        }
        else {
            if (dirDate < dateStart) {
                return dirsArray[i];
            }
        }

    }
}

function parsePath(path) {
    var length = path.length;
    var parsedPath = path[length - 1] === '/' ? path : path + '/';

    return parsedPath;
}

function mkdirSync(path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
}

//this is working for date based jobs, need to refactor
function makeFolders(context, op, job) {
    var logger = context.logger;
    logger.info('Creating directories ...');
    var path = parsePath(op.path);
    var interval = processInterval(job.process[0].interval);
    var start = moment.utc(job.process[0].start);
    var limit = moment.utc(job.process[0].end);

    while (start <= limit) {
        var str = start.format();
        dirs[str] = true;
        mkdirSync(path + str);
        start.add(interval[0], interval[1]);
    }
    logger.info('Directories have been made');

}

function schema(){
    return convict({})
}

module.exports = {
    newSender: newSender,
    schema: schema
};
