'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var pfs = Promise.promisifyAll(fs);
var parseError = require('./error_utils').parseError;
var shortid = require('shortid');
var decompress = require('decompress');
var rimraf = require('rimraf');


function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

function deleteDir(path) {
    return new Promise(function(resolve, reject) {
        rimraf(path, function(err, results) {
            if (err) reject(err);
            resolve(results)
        })
    })
}

function saveAsset(logger, assets_path, id, binaryData) {
    return new Promise(function(resolve, reject) {
        var newPath = `${assets_path}/${id}`;
        var tempFileName = `${newPath}/${shortid.generate()}.zip`;

        pfs.mkdirAsync(newPath)
            .then(function() {
                return pfs.writeFileAsync(tempFileName, binaryData)
            })
            .then(function() {
                //strip flattens the dir one level if zip is a dir, if zip if multiple files then it does not flatten
                return decompress(tempFileName, newPath, {strip: 1})
            })
            .then(function(data) {
                return pfs.unlinkAsync(tempFileName)
            })
            .then(function() {
                var metaData = {id: id};
                var packagePath = `${newPath}/asset.json`;
                if (existsSync(packagePath)) {
                    var packageData = require(packagePath);
                    metaData.version = packageData.version;
                    metaData.name = packageData.name;
                }

                resolve(metaData)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error downloading assets`, errMsg);
                //cleanup remnant directory
                deleteDir(newPath)
                    .then(function() {
                        reject(errMsg)
                    })
            })

    })
}

function _getName(str) {
    if (str.includes('/')) {
        return str.split('/')[0]
    }
    return str
}


module.exports = {
    existsSync: existsSync,
    saveAsset: saveAsset,
    deleteDir: deleteDir
};