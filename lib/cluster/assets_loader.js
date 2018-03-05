'use strict';

const Promise = require('bluebird');
const messageModule = require('./services/messaging');
const existsSync = require('../utils/file_utils').existsSync;
const saveAsset = require('../utils/file_utils').saveAsset;
const parseError = require('error_parser');

// this is a child process spawned by node_master to download assets
module.exports = function (context) {
    const logger = context.apis.foundation.makeLogger({ module: 'asset_manager' });
    const clusterConfig = context.sysconfig.teraslice;
    const assetsDir = clusterConfig.assets_directory;
    const messaging = messageModule(context, logger);
    const config = context.sysconfig.teraslice;

    messaging.register({ event: 'worker:shutdown', callback: shutdown });

    const job = JSON.parse(process.env.job);
    const exId = job.ex_id;

    function shutdown() {
        let counter = config.shutdown_timeout;
        return new Promise((resolve) => {
            const shutDownInterval = setInterval(() => {
                if (counter <= 0) {
                    logger.error(`shut down time limit has been reached, asset_loader for execution ${exId} will exit while its loading assets ${JSON.stringify(job.assets)}`);
                    clearInterval(shutDownInterval);

                    Promise.resolve()
                        .then(logger.flush)
                        .finally(resolve(true));
                } else {
                    if (counter % 6000 === 0) {
                        logger.warn(`shutdown sequence initiated, but is still processing. Will force shutdown in ${counter / 1000} seconds`);
                    }

                    counter -= 1000;
                }
            }, 1000);
        });
    }

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

    const msgId = process.env.__msgId;
    // need to mock incoming message for response since this is dynamically created
    const respondingData = { __source: 'cluster_master', __msgId: msgId };
    Promise.resolve(require('./storage/assets')(context))
        .then(assetStore => loadAssets(assetStore, job.assets))
        .then((assetArray) => {
            if (process.env.preload) {
                messaging.respond(respondingData, { message: 'assets:preloaded', meta: assetArray });
            } else {
                messaging.send({ to: 'execution', message: 'assets:loaded', ex_id: exId, meta: assetArray });
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
                messaging.respond(respondingData, { message: 'assets:preloaded', error: errMsg });
            } else {
                messaging.send({ to: 'execution', message: 'assets:loaded', ex_id: exId, error: errMsg });
            }

            process.exit(0);
        });
};
