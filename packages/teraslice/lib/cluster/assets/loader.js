'use strict';

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const { saveAsset } = require('../../utils/file_utils');
const makeSimpleContext = require('../../config/simple-context');
const { safeDecode } = require('../../utils/encoding_utils');
const makeAssetStore = require('../storage/assets');

class AssetLoader {
    constructor(context, assets = []) {
        this.context = context;
        this.assets = assets;
        this.assetsDirectory = _.get(context, 'sysconfig.teraslice.assets_directory');
        this.assetIds = [];
    }

    async load() {
        const {
            context,
            assets,
            assetsDirectory
        } = this;
        const { logger } = context;

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

        if (this.assetStore) {
            await this.assetStore.shutdown(true);
        }

        return idArray;
    }
}

if (require.main === module) {
    const context = makeSimpleContext();
    const assets = safeDecode(process.env.ASSETS);
    const assetLoader = new AssetLoader(context, assets);
    assetLoader.load()
        .then((assetIds) => {
            process.send({
                assetIds,
                success: true,
            });
            setTimeout(() => {
                process.exit(0);
            }, 500);
        })
        .catch((err) => {
            process.send({
                error: parseError(err),
                success: false,
            });
            setTimeout(() => {
                process.exit(1);
            }, 500);
        });
} else {
    module.exports = AssetLoader;
}
