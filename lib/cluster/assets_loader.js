'use strict';

const Promise = require('bluebird');
const messageModule = require('./services/messaging');
const existsSync = require('../utils/file_utils').existsSync;
const saveAsset = require('../utils/file_utils').saveAsset;
const parseError = require('../utils/error_utils').parseError;

// this is a child process spawned by node_master to download assets
module.exports = function (context) {
    const logger = context.foundation.makeLogger({ module: 'asset_manager' });
    const clusterConfig = context.sysconfig.teraslice;
    const assetsDir = clusterConfig.assets_directory;
    const messaging = messageModule(context, logger);

    function loadAssets(assetStore, assetsArray) {
        // first step we normalize all identifiers to their proper id
        return assetStore.parseAssetsArray(assetsArray)
            .then(idArray => Promise.map(idArray, (assetIdentifier) => {
                if (!alreadyDownloaded(assetIdentifier)) {
                    return assetStore.get(assetIdentifier)
                        .then((assetRecord) => {
                            logger.info(`loading assets: ${assetIdentifier}`);
                            const buff = new Buffer(assetRecord.blob, 'base64');
                            return saveAsset(logger, assetsDir, assetIdentifier, buff);
                        });
                }

                // need to return the id to the assets array sent back
                return { id: assetIdentifier };
            }));
    }

    function alreadyDownloaded(assetID) {
        return existsSync(`${clusterConfig.assets_directory}/${assetID}`);
    }

    // TODO currently any job asset that doesn't exist in elasticsearch is ignored
    const job = JSON.parse(process.env.job);
    const identifier = job.ex_id ? job.ex_id : job._msgID;
    const msgId = process.env._msgID;

    Promise.resolve(require('./storage/assets')(context))
        .then(assetStore => loadAssets(assetStore, job.assets))
        .then((assetArray) => {
            if (process.env.preload) {
                messaging.respond({ _msgID: msgId }, { message: 'assets:preloaded', identifier, meta: assetArray });
            } else {
                messaging.send({ message: 'assets:loaded', identifier, meta: assetArray });
            }
            return true;
        })
        .then(() => {
            process.exit(0);
        })
        .catch((err) => {
            let errMsg = parseError(err);
            if (errMsg === 'Not Found') {
                errMsg = 'One of the assets provided was not found';
            }
            logger.error(`error loading assets ${JSON.stringify(job.assets)}, error: ${errMsg}`);
            // error not found first appears when job is submitted
            if (process.env.preload) {
                messaging.send({ message: 'assets:preloaded', identifier, error: errMsg });
            } else {
                messaging.send({ message: 'assets:loaded', identifier, error: errMsg });
            }

            process.exit(0);
        });
};
