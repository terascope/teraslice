'use strict';
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var moment = require('moment');
var processInterval = require('./config').processInterval;
Promise.promisifyAll(fs);

var dirs = {};

var win32 = process.platform === 'win32';
// Normalize \\ paths to / paths.

function unixifyPath(filepath) {
    if (win32) {
        return filepath.replace(/\\/g, '/');
    } else {
        return filepath;
    }
}

function getDirs (){
    return dirs;
}

function setDirs(obj){
    dirs = obj;
}

// Recurse into a directory, executing callback for each file.
function walk(rootdir, callback, subdir) {
    var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
    fs.readdirSync(abspath).forEach(function (filename) {
        var filepath = path.join(abspath, filename);
        if (fs.statSync(filepath).isDirectory()) {
            walk(rootdir, callback, unixifyPath(path.join(subdir || '', filename || '')));
        } else {
            callback(unixifyPath(filepath), rootdir, subdir, filename);
        }
    });
}


/*function findConfigs() {
 var schema = [];
 var configs = [];
 var rootPath = process.cwd();
 walk(rootPath, function (filepath, rootdir, subdir, filename) {
 if (filename === 'config-schema.js') {
 schema.push(filepath);
 }
 if (filename === '__config.json') {
 configs.push(filepath);
 }
 });

 return {schema: schema, configs: configs, rootPath: rootPath};
 }*/


function getData() {

}

function fromElastic(data) {
    return data.hits.hits.map(function (obj) {
        return obj._source
    });
}

function processData(data, job) {
    //can change this for backup but returning all metadata
    if (job.source.system === 'elasticsearch') {
        return fromElastic(data);
    }
}

function findDir(path, date){
    var dirsArray = fs.readdirSync(path);
    var dateStart = new Date(date.start);

    for (var i = 0; i < dirsArray.length; i++) {
        var dirDate = new Date(dirsArray[i]);
       if (dirsArray[i+1]) {
            var nextDir = new Date(dirsArray[i+1]);

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

function sendData(client, data, job, msg) {
    var path = parsePath(job.destination.path);

    var filePath;
    var data = JSON.stringify(data);

    if(dirs[msg.start]){
          filePath = path + msg.start + '/' + msg.start;
        return fs.writeFile(filePath, data, 'utf-8')
    }
    else {
        filePath = path + findDir(path, msg) + '/' + msg.start;
        return fs.writeFile(filePath, data, 'utf-8')
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
function makeFolders(job, logger) {
    var path = parsePath(job.destination.path);
    var interval = processInterval(job.source.interval);
    var start = moment.utc(job.source.start);
    var limit = moment.utc(job.source.end);

    logger.info('constructing directories at: ' + path);
    while (start <= limit) {
        var str = start.format();
        dirs[str] = true;
        mkdirSync(path + str);
        start.add(interval[0], interval[1]);
    }

    logger.info('All directories have been made');

}

module.exports = {
    getData: getData,
    processData: processData,
    sendData: sendData,
    makeFolders: makeFolders,
    getDirs: getDirs,
    setDirs: setDirs,
    findDir: findDir
};