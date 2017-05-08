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
    console.log('what job', job);
    function assetsToLoad(assetsArray){
        console.log('what array', assetsArray);
        return assetsArray.filter(function(assetID){
            console.log('what id', assetID);
            return existsSync(`${clusterConfig.assets_directory}/${assetID}`) !== true;
        })
    }
    
    var neededAssets = assetsToLoad(job.assets);
    console.log('neededAssets', neededAssets)
    if(neededAssets.length === 0){
        logger.debug('all assets exists for job');
        process.exit(0)
    }
    // TODO currently any job asset that doesn't exist in elasticsearch is ignored
    
    Promise.resolve(require('./storage/assets')(context))
        .then(function(asset_store) {
            return Promise.map(neededAssets,
                function(assetID) {
                    console.log('assetID', assetID);
                    return asset_store.get(assetID)
                        .then(function(assetRecord) {
                            logger.info(`loading assets: ${assetID}`);
                            var buff = new Buffer(assetRecord.blob, 'base64');
                           return saveAsset(logger, clusterConfig.assets_directory, assetID, buff);
                        });
                })
        })
        .then(function() {
            messaging.send({message: 'assets:loaded', ex_id: ex_id});
            process.exit(0);
        })
        .catch(function(err) {
            console.log('error from loading', err);
            logger.error(err)
        })

};
