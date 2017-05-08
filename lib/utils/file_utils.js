'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var pfs = Promise.promisifyAll(fs);
var parseError = require('./error_utils').parseError;
var shortid = require('shortid');
var decompress = require('decompress');


function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
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
                return decompress(tempFileName, newPath)
            })
            .then(function(zipList) {
                return Promise.all([_getName(zipList[0].path), pfs.unlinkAsync(tempFileName)])
            })
            .spread(function(name, deleted) {
                resolve(name)
            })
            .catch(function(err) {
                var errMsg = parseError(err);
                logger.error(`Error downloading assets`, errMsg);
                reject(errMsg)
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
    saveAsset: saveAsset
};