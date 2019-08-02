'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');
const { getFullErrorStack, TSError, pDelay } = require('@terascope/utils');
const makeTerafoundationContext = require('../context/terafoundation-context');
const makeAssetStore = require('../../cluster/storage/assets');
const { safeDecode } = require('../../utils/encoding_utils');
const { makeLogger } = require('../helpers/terafoundation');
const { saveAsset } = require('../../utils/file_utils');

class AssetLoader {
    constructor(context, assets = []) {
        this.context = context;
        this.logger = makeLogger(context, 'asset_loader');
        this.assets = assets;
        this.assetsDirectory = _.get(context, 'sysconfig.teraslice.assets_directory');
        this.isShuttingDown = false;
    }

    async load() {
        const { context, assets, assetsDirectory } = this;

        // no need to load assets
        if (_.isEmpty(assets)) return [];

        this.logger.info('Loading assets...');

        this.assetStore = await makeAssetStore(context);

        let idArray = [];

        try {
            idArray = await this.assetStore.parseAssetsArray(assets);
        } catch (err) {
            throw new TSError(err);
        }

        await Promise.all(
            idArray.map(async (assetIdentifier) => {
                const downloaded = await fs.pathExists(path.join(assetsDirectory, assetIdentifier));
                // need to return the id to the assets array sent back
                if (downloaded) return { id: assetIdentifier };

                const assetRecord = await this.assetStore.get(assetIdentifier);
                this.logger.info(`loading assets: ${assetIdentifier}`);
                const buff = Buffer.from(assetRecord.blob, 'base64');
                return saveAsset(this.logger, assetsDirectory, assetIdentifier, buff);
            })
        );

        try {
            await this.shutdown();
        } catch (err) {
            this.logger.error(err, 'assets loading shutdown error');
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

    (async () => {
        try {
            const assetIds = await loadAssets(context, assets);
            process.send({
                assetIds: assetIds || [],
                success: true
            });
        } catch (err) {
            process.send({
                error: getFullErrorStack(err),
                success: false
            });
            process.exitCode = 1;
        } finally {
            await pDelay(500);
            process.exit();
        }
    })();
} else {
    module.exports = loadAssets;
}
