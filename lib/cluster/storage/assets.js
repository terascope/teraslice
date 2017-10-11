'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var crypto = require('crypto');
var _ = require('lodash');
var parseError = require('../../utils/error_utils').parseError;
var saveAsset = require('../../utils/file_utils').saveAsset;
var normalizeZipFile = require('../../utils/file_utils').normalizeZipFile;
var fse = require('fs-extra');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    var logger = context.foundation.makeLogger({module: 'assets_storage'});
    var config = context.sysconfig.teraslice;
    var assets_path = config.assets_directory;
    var index_name = `${config.name}__assets`;

    var backend;

    function save(data) {
        var metaData;
        var esData = data.toString('base64');
        var id = crypto.createHash('sha1').update(esData).digest("hex");
        return fs.openAsync(`${assets_path}/${id}`, 'r')
            .then(function() {
                // directory exists, need to check if the index has it, if not then save it
                return backend.get(id, null, ['name'])
                // it exists, just return the id
                    .then(() => id)
                    .catch((err) => {
                        if (err === 'Not Found') {
                            logger.info(`asset: ${id} exists on disk but not in index, saving asset to index`);
                            return normalizeZipFile(id, `${assets_path}/${id}`, logger)
                                .then((_metaData) => {
                                    metaData = _metaData;
                                    const fileData = { blob: esData, _created: new Date() };
                                    const file = _.assign(fileData, _metaData);
                                    return backend.indexWithId(id, file);
                                })
                                .then(() => {
                                    logger.info(`assets: ${metaData.name}, id: ${id} has been saved to elasticsearch`);
                                    return id;
                                });
                        }
                        return Promise.reject(`error checking asset index, could not get asset with id: ${id}`);
                    });
            })
            .catch(function(err) {
                // directory does not exist, need to save it
                if (err.code === 'ENOENT') {
                    return Promise.resolve(saveAsset(logger, assets_path, id, data, _metaIsUnqiue))
                        .then(function(_metaData) {
                            metaData = _metaData;
                            var file = _.assign({blob: esData, _created: new Date()}, _metaData);
                            return backend.indexWithId(id, file)
                        })
                        .then(function() {
                            logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
                            return id;
                        })
                        .catch(function(err) {
                            var errMsg = parseError(err);
                            logger.error(errMsg);
                            return Promise.reject(errMsg)
                        });
                }
                else {
                    return Promise.reject(err)
                }
            })
    }

    function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort, fields);
    }

    function get(id) {
        return backend.get(id);
    }

    function getAssetId(assetIdentifier) {
        //is full _id
        if (assetIdentifier.length === 40) {
            //need to return a promise
            return Promise.resolve(assetIdentifier)
        }
        else {
            var metaData = assetIdentifier.split(":");

            //if no version specified get latest
            if (metaData.length === 1 || metaData[1] === 'latest') {
                return search(`name:${metaData[0]}`, null, 1, `_created:desc`)
                    .then(function(assetRecord) {
                        var record = assetRecord.hits.hits[0];
                        if (!record) {
                            return Promise.reject(`asset: ${metaData.join(' ')} was not found`)
                        }
                        return record._id;
                    });
            }
            else {
                //has wildcard in version
                return search(`name:${metaData[0]} AND version:${metaData[1]}`, null, 10000, `_created:desc`, ['version'])
                    .then(function(assetRecords) {
                        var records = assetRecords.hits.hits.map(record => ({
                            id: record._id,
                            version: record._source.version
                        }));

                        var versionID = metaData[1];
                        var wildcardPlacement = versionID.indexOf('*') - 1;
                        var versionTransform = versionID.split('.');
                        var parsedVersionWildcardPlacement = versionTransform.indexOf('*');
                        var versionSlice = versionTransform.filter(chars => chars !== '*').join('.');

                        if (records.length === 0) {
                            return Promise.reject(`No asset with the provided name and version could be located, asset: ${metaData.join(':')}`)
                        }

                        return records.reduce(function(prev, curr) {
                            return compareVersions(prev, curr, wildcardPlacement, versionSlice, parsedVersionWildcardPlacement)
                        }).id;
                    });
            }
        }
    }

    function parseAssetsArray(assetsArray) {
        return Promise.map(assetsArray, getAssetId)
    }


    function compareVersions(prev, curr, wildcardPlacement, versionSlice, parsedVersionWildcardPlacement) {
        var prevBool = prev.version.slice(0, wildcardPlacement) === versionSlice;
        var currBool = curr.version.slice(0, wildcardPlacement) === versionSlice;

        //if they both match up to wildcard
        if (prevBool && currBool) {
            var prevVersion = prev.version.split('.');
            var currVersion = curr.version.split('.');

            if (Number(prevVersion[parsedVersionWildcardPlacement]) < Number(currVersion[parsedVersionWildcardPlacement])) {
                return curr
            }
            return prev
        }

        if (prevBool && !currBool) {
            return prev
        }
        else {
            return curr
        }
    }

    function _metaIsUnqiue(meta) {
        return search(`name:${meta.name} AND version:${meta.version}`, null, 10000)
            .then(function(results) {
                if (results.hits.hits.length === 0) {
                    return meta
                }
                else {
                    return Promise.reject(`asset name:${meta.name} and version:${meta.version} already exists, please increment the version and send again`)
                }
            })
    }

    function _registerContextAPI() {
        // This will register the API under context.apis.assets
        context.apis.registerAPI('assets', {
            getPath: _getPath
        });

        // FIXME: this form of the api call is deprecated and should be removed
        // prior to 1.0
        context.assets = {};
        context.assets.getPath = _getPath;
    }

    function _getPath(assetIdentifier) {
        return getAssetId(assetIdentifier)
            .then(id => `${assets_path}/${id}`);
    }

    function shutdown() {
        logger.info("shutting asset store down.");
        return backend.shutdown();
    }

    function remove(asset_id) {
        return Promise.all([backend.remove(asset_id), fse.remove(`${assets_path}/${asset_id}`)]);
    }

    var api = {
        save: save,
        search: search,
        get: get,
        remove: remove,
        parseAssetsArray: parseAssetsArray,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'asset', '_id', null, true)
        .then(function(elasticsearch) {
            backend = elasticsearch;

            _registerContextAPI();

            return api;
        });
};
