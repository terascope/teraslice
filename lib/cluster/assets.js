'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var messageModule = require('./services/messaging');
var decompress = require('decompress');
var existsSync = require('../utils/file_utils').existsSync;

module.exports = function(context) {
    var logger = context.foundation.makeLogger('asset_manager', 'asset_manager', {module: 'asset_manager'});
    var clusterConfig = context.sysconfig.teraslice;

    var job = JSON.parse(process.env.job);
    var ex_id = job.ex_id;
    var messaging = messageModule(context, logger);
    
    function assetsToLoad(assetsArray){
        return assetsArray.filter(function(asset){
            return existsSync(`${clusterConfig.assets_directory}/${asset}`) !== true;
        })
    }
    
    var neededAssets = assetsToLoad(job.assets);
    
    if(neededAssets.length === 0){
        logger.debug('all assets exists for job');
        process.exit(0)
    }

    Promise.resolve(require('./storage/assets')(context))
        .then(function(asset_store) {
            return Promise.map(neededAssets,
                function(asset) {
                    return asset_store.search(`name:${asset}`, null, 1, null)
                        .then(function(docs) {
                            logger.info(`loading assets: ${asset}`);
                            var buff = new Buffer(docs[0].blob, 'base64');
                            return decompress(buff, clusterConfig.assets_directory);
                        });
                })
        })
        .then(function() {
            messaging.send({message: 'assets:loaded', ex_id: ex_id});
            process.exit(0);
            console.log('sent message');
        })
        .catch(function(err) {
            console.log('error from loading', err);
            logger.error(err)
        })

};
