'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var messageModule = require('./services/messaging');
var decompress = require('decompress');
var existsSync = require('../utils/file_utils').existsSync;
var saveAsset = require('../utils/file_utils').saveAsset;
var parseError = require('../utils/error_utils').parseError;

// this is a child process spawned by node_master to download assets
module.exports = function(context) {
    var logger = context.foundation.makeLogger({module: 'asset_manager'});
    var clusterConfig = context.sysconfig.teraslice;

    var messaging = messageModule(context, logger);

    function loadAssets(asset_store, assetsArray) {
        //first step we normalize all identifiers to their proper id
        return asset_store.parseAssetsArray(assetsArray)
            .then(function(idArray) {
                return Promise.map(idArray, function(assetIdentifier) {
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
                })
            })
    }

    function alreadyDownloaded(assetID) {
        return existsSync(`${clusterConfig.assets_directory}/${assetID}`);
    }

    // TODO currently any job asset that doesn't exist in elasticsearch is ignored
    var job = JSON.parse(process.env.job);
    var identifier = job.ex_id ? job.ex_id : job._msgID;

    Promise.resolve(require('./storage/assets')(context))
        .then(function(asset_store) {
            return loadAssets(asset_store, job.assets)
        })
        .then(function(assetArray) {
            if (process.env.preload) {
                messaging.send({
                    message: 'assets:preloaded',
                    identifier: identifier,
                    assets: assetArray.map(obj => obj.id)
                });
            }
            else {
                messaging.send({message: 'assets:loaded', identifier: identifier, meta: assetArray});
            }
            return true;
        })
        .then(function() {
            process.exit(0);
        })
        .catch(function(err) {
            var errMsg = parseError(err);
            if (errMsg === 'Not Found') {
                errMsg = `One of the assets provided was not found`;
            }
            logger.error(`error loading assets ${JSON.stringify(job.assets)}, error: ${errMsg}`);
            //error not found first appears when job is submitted
            if (process.env.preload) {
                messaging.send({message: 'assets:preloaded', identifier: identifier, error: errMsg});
            }
            else {
                messaging.send({message: 'assets:loaded', identifier: identifier, error: errMsg});
            }

            process.exit(0);
        })


};
