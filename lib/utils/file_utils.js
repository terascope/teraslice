'use strict';

var fs = require('fs');
var Promise = require('bluebird');
var fse = require('fs-extra');
var parseError = require('./error_utils').parseError;
var shortid = require('shortid');
var decompress = require('decompress');
var _ = require('lodash');

function existsSync(filename) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (ex) {
        return false;
    }
}

function deleteDir(path) {
    return fse.remove(path)
}

function normalizeZipFile(id, newPath, logger) {
    var metaData = {id: id};
    var packagePath = `${newPath}/asset.json`;

    return fse.open(packagePath, 'r')
        .then(function() {
            return fse.readJson(packagePath)
                .then(function(packageData) {
                    _.assign(metaData, packageData);
                    return metaData
                })
                .catch(function(err) {
                    var errMsg = "error occurred while parsing asset.json, please ensure that's it formatted correctly";
                    logger.error(errMsg);
                    return Promise.reject({parseError: true, msg: errMsg})
                })

        })
        .catch(function(err) {
            //JSON is formatted incorrectly
            if (err.parseError) {
                return Promise.reject(err.msg)
            }
            else {
                //check one subdir down for asset.sjon
                var assetJSON = fs.readdirSync(newPath)
                    .filter(function(filename) {
                        return existsSync(`${newPath}/${filename}/asset.json`)
                    });

                if (assetJSON.length === 0) {
                    return Promise.reject("asset.json was not found in root directory of asset bundle nor any immediate sub directory")
                }
                else {
                    return fse.readJson(`${newPath}/${assetJSON[0]}/asset.json`)
                        .then(function(packageData) {
                            _.assign(metaData, packageData);

                            return Promise.resolve(moveContents(newPath, `${newPath}/${assetJSON[0]}`))
                                .then(function() {
                                    return metaData
                                })
                        })
                        .catch(function(err) {
                            var errMsg = "error occurred while parsing asset.json, please ensure that's it formatted correctly";
                            return Promise.reject(errMsg)
                        })

                }
            }
        })
}

function moveContents(rootPath, subDirPath) {
    var children = fs.readdirSync(subDirPath);
    return Promise.map(children, function(child) {
        return fse.move(`${subDirPath}/${child}`, `${rootPath}/${child}`)
    })
        .then(function() {
            return fse.remove(subDirPath)
        })
}

function saveAsset(logger, assets_path, id, binaryData, metaCheck) {
    var newPath = `${assets_path}/${id}`;
    var tempFileName = `${newPath}/${shortid.generate()}.zip`;

    return fse.mkdir(newPath)
        .then(function() {
            return fse.writeFile(tempFileName, binaryData)
        })
        .then(function() {
            //strip flattens the dir one level if zip is a dir, if zip if multiple files then it does not flatten
            return decompress(tempFileName, newPath)
        })
        .then(function(data) {
            return fse.unlink(tempFileName)
        })
        .then(function() {
            return normalizeZipFile(id, newPath, logger)
                .then(function(metaData) {
                    // storage/assets save fn needs to check the return metadata for uniqueness
                    if (metaCheck) {
                        return metaCheck(metaData)
                    }
                    else {
                        return metaData
                    }
                })
        })

        .catch(function(err) {
            var errMsg = parseError(err);
            logger.error(`Error downloading assets`, errMsg);
            //cleanup remnant directory
            return deleteDir(newPath)
                .then(function() {
                    return Promise.reject(errMsg)
                })
        })

}


module.exports = {
    existsSync: existsSync,
    saveAsset: saveAsset,
    deleteDir: deleteDir
};