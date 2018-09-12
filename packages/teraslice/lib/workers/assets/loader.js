'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const { saveAsset } = require('../../utils/file_utils');
const makeTerafoundationContext = require('../context/terafoundation-context');
const { safeDecode } = require('../../utils/encoding_utils');
const makeAssetStore = require('../../cluster/storage/assets');

class AssetLoader {
    constructor(context, assets = []) {
        this.context = context;
        this.logger = context.apis.foundation.makeLogger({ module: 'assets_loader' });
        this.assets = assets;
        this.assetsDirectory = _.get(context, 'sysconfig.teraslice.assets_directory');
        this.isShuttingDown = false;
    }

    async load() {
        const {
            context,
            assets,
            assetsDirectory
        } = this;
        const { logger } = context;

        this.logger.info('Loading assets...');

        // no need to load assets
        if (_.isEmpty(assets)) return [];

        this.assetStore = await makeAssetStore(context);

        let idArray;

        try {
            idArray = await this.assetStore.parseAssetsArray(assets);
        } catch (err) {
            if (_.isString(err)) {
                throw new Error(err);
            } else {
                throw err;
            }
        }

        await Promise.map(idArray, async (assetIdentifier) => {
            const downloaded = await fs.pathExists(path.join(assetsDirectory, assetIdentifier));
            // need to return the id to the assets array sent back
            if (downloaded) return { id: assetIdentifier };

            const assetRecord = await this.assetStore.get(assetIdentifier);
            logger.info(`loading assets: ${assetIdentifier}`);
            const buff = Buffer.from(assetRecord.blob, 'base64');
            return saveAsset(logger, assetsDirectory, assetIdentifier, buff);
        });

        try {
            await this.shutdown();
        } catch (err) {
            logger.error('assets loading shutdown error', err);
        }

        return idArray;
    }

    async shutdown() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        if (this.assetStore) {
            await this.assetStore.shutdown(true);
        }
    }
}

async function loadAssets(context, assets) {
    const assetLoader = new AssetLoader(context, assets);
    try {
        return assetLoader.load();
    } catch (err) {
        /* istanbul ignore next */
        try {
            await assetLoader.shutdown();
        } catch (shutdownErr) {
            return [];
        }
        return [];
    }
}

if (require.main === module) {
    const context = makeTerafoundationContext();
    const assets = safeDecode(process.env.ASSETS);

    Promise.resolve(loadAssets(context, assets))
        .then((assetIds) => {
            process.send({
                assetIds,
                success: true,
            });
        })
        .catch((err) => {
            process.send({
                error: parseError(err),
                success: false,
            });
            process.exitCode = 1;
        })
        .finally(() => {
            setTimeout(() => {
                process.exit();
            }, 500);
        });
} else {
    module.exports = loadAssets;
}
