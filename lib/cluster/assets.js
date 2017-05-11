'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var messageModule = require('./services/messaging');
var decompress = require('decompress');
var existsSync = require('../utils/file_utils').existsSync;
var saveAsset = require('../utils/file_utils').saveAsset;

module.exports = function(context) {
    var logger = context.foundation.makeLogger('asset_manager', 'asset_manager', {module: 'asset_manager'});
    var clusterConfig = context.sysconfig.teraslice;

    var job = JSON.parse(process.env.job);
    var ex_id = job.ex_id;
    var messaging = messageModule(context, logger);


    function loadAssets(asset_store, assetsArray) {
        //first step we normalize all identifiers to their proper id
        return Promise.map(assetsArray, function(assetIdentifier) {
            //is full _id
            if (assetIdentifier.length === 40) {
                if (!alreadyDownloaded(assetIdentifier)) {
                    return asset_store.get(assetIdentifier)
                        .then(function(assetRecord) {
                            logger.info(`loading assets: ${assetIdentifier}`);
                            var buff = new Buffer(assetRecord.blob, 'base64');
                            return saveAsset(logger, clusterConfig.assets_directory, assetIdentifier, buff);
                        });
                }
                else {
                    //need to return the id to the assets array sent back
                    return {id: assetIdentifier}
                }
            }
            else {
                var metaData = assetIdentifier.split(":");

                //if no version specified get latest
                if (metaData.length === 1 || metaData[1] === 'latest') {
                    return asset_store.search(`name:${metaData[0]}`, null, 1, `_created:desc`)
                        .then(function(assetRecord) {
                            logger.info(`loading assets: ${assetIdentifier}`);
                            var record = assetRecord.hits.hits[0];

                            if (!alreadyDownloaded(record._id)) {
                                var buff = new Buffer(record._source.blob, 'base64');
                                return saveAsset(logger, clusterConfig.assets_directory, record._id, buff);
                            }
                            else {
                                return {id: record._id}
                            }
                        });
                }
                else {
                    //has wildcard in version
                    return asset_store.search(`name:${metaData[0]} AND version:${metaData[1]}`, null, 10000, `_created:desc`, ['version'])
                        .then(function(assetRecords) {
                            // logger.info(`loading assets: ${assetIdentifier}`);
                            var records = assetRecords.hits.hits.map(record => ({
                                id: record._id,
                                version: record._source.version
                            }));

                            var versionID = metaData[1];
                            var wildcardPlacement = versionID.indexOf('*') - 1;
                            var versionTransform = versionID.split('.');
                            var parsedVersionWildcardPlacement = versionTransform.indexOf('*');
                            var versionSlice = versionTransform.filter(chars => chars !== '*').join('.');

                            var id = records.reduce(function(prev, curr) {
                                return compareVersions(prev, curr, wildcardPlacement, versionSlice, parsedVersionWildcardPlacement)
                            }).id;
                            
                            if (!alreadyDownloaded(id)) {
                                return asset_store.get(id)
                                    .then(function(assetRecord) {
                                        logger.info(`loading assets: ${id}`);
                                        var buff = new Buffer(assetRecord.blob, 'base64');
                                        return saveAsset(logger, clusterConfig.assets_directory, id, buff);
                                    });
                            }
                            else {
                                return {id: id}
                            }
                        });
                }
            }
        })
    }

    function alreadyDownloaded(assetID) {
        return existsSync(`${clusterConfig.assets_directory}/${assetID}`);
    }

    // TODO currently any job asset that doesn't exist in elasticsearch is ignored

    Promise.resolve(require('./storage/assets')(context))
        .then(function(asset_store) {
            return loadAssets(asset_store, job.assets)
        })
        .then(function(assetArray) {
            messaging.send({message: 'assets:loaded', ex_id: ex_id, meta: assetArray});
            process.exit(0);
        })
        .catch(function(err) {
            //TODO error out the job
            logger.error(err)
            process.exit(0);
        })

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


};
