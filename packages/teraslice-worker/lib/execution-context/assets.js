'use strict';

const fs = require('fs-extra');
const path = require('path');
const isEmpty = require('lodash/isEmpty');
const get = require('lodash/get');
const WrapError = require('../utils/wrap-error');
const {
    makeAssetStore,
    saveAsset,
} = require('../teraslice');

class Assets {
    constructor(context, executionContext) {
        this.context = context;
        this.assets = get(executionContext.job, 'assets', []);
        this.assetsDirectory = get(context, 'sysconfig.teraslice.assets_directory');
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
        if (isEmpty(assets)) return;

        this.assetStore = await makeAssetStore(context);

        let idArray;

        try {
            idArray = await this.assetStore.parseAssetsArray(assets);
        } catch (err) {
            throw new WrapError(err);
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

        this.assetIds = idArray;
    }
}

module.exports = Assets;
