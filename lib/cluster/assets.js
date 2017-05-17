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
            logger.error(err);
            process.exit(0);
        })


};
