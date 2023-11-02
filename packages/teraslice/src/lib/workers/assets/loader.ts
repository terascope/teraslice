/* eslint-disable @typescript-eslint/no-unused-vars */ // TODO: fix this
import path from 'node:path';
import fs from 'node:fs';
import {
    get, isEmpty, Logger, getFullErrorStack,
    pDelay
} from '@terascope/utils';
import type { Context } from '@terascope/job-components';
import { makeTerafoundationContext } from '../context/terafoundation-context';
import { AssetsStorage } from '../../storage';
import { safeDecode } from '../../utils/encoding_utils';
import { makeLogger } from '../helpers/terafoundation';
import { saveAsset } from '../../utils/file_utils';

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

                const buff = Buffer.from(assetRecord.blob, 'base64');
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

// async function loadAssets(context, assets) {
//     const assetLoader = new AssetLoader(context, assets);
//     return assetLoader.load();
// }

// if (require.main === module) {
//     const context = makeTerafoundationContext();
//     const assets = safeDecode(process.env.ASSETS);

//     (async () => {
//         try {
//             const assetIds = await loadAssets(context, assets);
//             process.send({
//                 assetIds: assetIds || [],
//                 success: true
//             });
//         } catch (err) {
//             process.send({
//                 error: getFullErrorStack(err),
//                 success: false
//             });
//             process.exitCode = 1;
//         } finally {
//             await pDelay(500);
//             process.exit();
//         }
//     })();
// } else {
//     module.exports = loadAssets;
// }
