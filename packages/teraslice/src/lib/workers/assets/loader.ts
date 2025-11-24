import path from 'node:path';
import fs from 'node:fs';
import { get, isEmpty, Logger } from '@terascope/core-utils';
import type { Context } from '@terascope/job-components';
import { AssetsStorage } from '../../storage/index.js';
import { makeLogger } from '../helpers/terafoundation.js';
import { saveAsset } from '../../utils/file_utils.js';
import { getBackendConfig } from '../../storage/assets.js';

export class AssetLoader {
    readonly context: Context;
    readonly logger: Logger;
    readonly assets: string[];
    readonly assetsDirectory: string;
    assetsStorage: AssetsStorage;
    isShuttingDown = false;

    constructor(context: Context, assets: string[] = []) {
        this.context = context;
        this.logger = makeLogger(context, 'asset_loader');
        this.assets = assets;
        // TODO: need guard here
        this.assetsDirectory = get(context, 'sysconfig.teraslice.assets_directory') as string;
        this.assetsStorage = new AssetsStorage(context);
    }

    async load() {
        // no need to load assets
        if (isEmpty(this.assets)) return [];

        const { assignment } = this.context;
        const isWorker = assignment && assignment !== 'cluster_master';

        // A worker should already have the assets loaded,
        // so we should only log at info level if it gets here
        // If it is not worker this message isn't important so it
        // should be a debug log message
        if (isWorker) {
            this.logger.info('Loading assets...', this.assets);
        } else {
            this.logger.debug('Loading assets...', this.assets);
        }

        await this.assetsStorage.initialize();

        const idArray = await this.assetsStorage.parseAssetsArray(this.assets);

        const actualIds = await Promise.all(
            idArray.map(async (assetIdentifier) => {
                const assetDir = path.join(this.assetsDirectory, assetIdentifier);
                const downloaded = fs.existsSync(assetDir);
                // need to return the id to the assets array sent back
                if (downloaded) return assetIdentifier;

                const assetRecord = await this.assetsStorage.get(assetIdentifier);
                this.logger.info(`loading assets: ${assetIdentifier}`);
                let buff: Buffer;

                const { context, logger } = this;
                const connectionType = getBackendConfig(context, logger).assetConnectionType;
                if (connectionType === 's3') {
                    buff = assetRecord.blob as Buffer;
                } else {
                    if (!assetRecord.blob) {
                        throw new Error(`No asset blob found in elasticsearch index for asset identifier: ${assetIdentifier}.\n`
                            + `Confirm that "teraslice.ASSET_STORAGE_CONNECTION_TYPE" should be ${connectionType}.\n`
                            + 'Then try deleting and redeploying the asset.'
                        );
                    }
                    buff = Buffer.from(assetRecord.blob as string, 'base64');
                }

                const saveResult = await saveAsset(
                    this.logger,
                    this.assetsDirectory,
                    assetIdentifier,
                    buff
                );
                return saveResult.id;
            })
        );

        const matches = JSON.stringify(actualIds) === JSON.stringify(this.assets);

        if (!matches && isWorker) {
            this.logger.warn(
                `asset loader expected any array of the asset ids but got ${JSON.stringify(this.assets)}`
            );
        }

        return idArray;
    }
}
