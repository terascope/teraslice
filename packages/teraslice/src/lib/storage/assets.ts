import path from 'node:path';
import fse from 'fs-extra';
import crypto from 'node:crypto';
import {
    TSError, uniq, isString,
    toString, filterObject, Logger
} from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { ClientResponse, AssetRecord } from '@terascope/types';
import { TerasliceElasticsearchStorage, TerasliceStorageConfig } from './backends/elasticsearch_store.js';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { saveAsset, AssetMetadata } from '../utils/file_utils.js';
import {
    findMatchingAsset, findSimilarAssets, toVersionQuery,
    getInCompatibilityReason
} from '../utils/asset_utils.js';

function _metaIsUnique(backend: TerasliceElasticsearchStorage) {
    return async function checkMeta(meta: AssetMetadata): Promise<AssetMetadata> {
        const includes = ['name', 'version', 'node_version', 'platform', 'arch'];
        // @ts-expect-error
        const query = Object.entries(filterObject(meta, { includes }))
            .map(([key, val]) => `${key}:"${val}"`)
            .join(' AND ');

        const total = await backend.count(query);

        if (total === 0) {
            return meta;
        }

        const error = new TSError(`Asset ${query} already exists, please increment the version and send again`, {
            statusCode: 409
        });
        error.statusCode = 409;
        // @ts-expect-error a flag to differentiate error scenarios
        error.alreadyExists = true;
        throw error;
    };
}

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
export class AssetsStorage {
    readonly assetsPath: string;
    private esBackend: TerasliceElasticsearchStorage;
    private readonly context: Context;
    logger: Logger;
    private s3Backend?: S3Store; // new class to save assets in s3

    constructor(context: Context) {
        const logger = makeLogger(context, 'assets_storage');
        const config = context.sysconfig.teraslice;
        const indexName = `${config.name}__assets`;

        const esBackendConfig: TerasliceStorageConfig = {
            context,
            indexName,
            recordType: 'asset',
            idField: 'id',
            fullResponse: true,
            logRecord: false,
            storageName: 'assets',
            logger
        };
        this.context = context;
        this.logger = logger;
        // TODO: verify this behavior of string vs string[] and undefined
        this.assetsPath = config.assets_directory as string;
        this.esBackend = new TerasliceElasticsearchStorage(esBackendConfig);

        if (context.sysconfig.terafoundation.asset_storage_connector) {
            const s3BackendConfig: TerasliceS3StorageConfig = {
                connector: context.sysconfig.terafoundation.asset_storage_connector,
                bucket: context.sysconfig.terafoundation.asset_storage_bucket,
                // other stuff???
            };
            this.s3Backend = new S3Store(s3BackendConfig);
        }
    }

    async initialize() {
        await this.ensureAssetDir();
        await this.esBackend.initialize();
        await this.s3Backend.initialize(); // ????
        this.logger.info('assets storage initialized');
    }

    private async _assetExistsInFS(id: string): Promise<boolean> {
        try {
            if (!this.assetsPath) return false;
            // eslint-disable-next-line no-bitwise
            const access = fse.constants.F_OK | fse.constants.R_OK | fse.constants.W_OK;
            await fse.access(path.join(this.assetsPath, id), access);

            return true;
        } catch (err) {
            return false;
        }
    }

    private async _assetExistsInES(id: string): Promise<boolean> {
        try {
            const result = await this.esBackend.get(id, undefined, ['id', 'name']);
            return result != null;
        } catch (err) {
            if (err.statusCode === 404) {
                return false;
            }
            throw new TSError(err, {
                reason: `Failure checking asset index, could not get asset with id: ${id}`
            });
        }
    }

    // if asset is in s3 it will have metadata is ES, so do we need to check s3 at all?
    private async _assetExists(id: string) {
        const [readable, exists] = await Promise.all([
            this._assetExistsInFS(id),
            this._assetExistsInES(id)
        ]);

        return readable && exists;
    }
    // data is the buffer form of asset, stored in filesystem
    // esData is the base64 version which is stored in elasticsearch
    private async _saveAndUpload({
        id, data, esData, blocking
    }: { id: string, data: Buffer, esData: string, blocking: boolean }) {
        const responseTimeout = this.context.sysconfig.teraslice.api_response_timeout as number;
        const startTime = Date.now();

        const metaData = await saveAsset(
            this.logger,
            this.assetsPath,
            id,
            data,
            _metaIsUnique(this.esBackend) // all metadata on assets saved in es, so this will work on S3 assets
        );

        let emptyBlob = false;
        // add save to s3 here
        if (this.s3Backend) {
            if (blocking) {
                const elapsed = Date.now() - startTime;
                const remaining = responseTimeout - elapsed;
                await this.s3Backend.save(id, data, remaining);
            } else {
                await this.s3Backend.save(id, data, responseTimeout);
            }
            emptyBlob = true;

            this.logger.info(`assets: ${metaData.name}, id: ${id} has been saved to s3 store`);
        }

        const blobContents = emptyBlob ? '' : esData;

        const assetRecord = Object.assign({
            blob: blobContents, // send no blob if using s3
            _created: new Date().toISOString()
        }, metaData);

        if (blocking) {
            const elapsed = Date.now() - startTime;
            const remaining = responseTimeout - elapsed;
            await this.esBackend.indexWithId(id, assetRecord, undefined, remaining);
        } else {
            await this.esBackend.indexWithId(id, assetRecord, undefined, responseTimeout);
        }

        this.logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
    }

    /**
     * Save an asset to disk and upload to elasticsearch or s3
     *
     * @param data {Buffer} A buffer of the asset file (zipped)
     * @param blocking {boolean=true} If false, save the asset in the background
     * @returns {Promise<{ assetId: string; created: boolean }>}
    */
    async save(data: Buffer, blocking = true) {
        const esData = data.toString('base64');
        const id = crypto.createHash('sha1').update(esData).digest('hex');

        const exists = await this._assetExists(id);

        if (exists) {
            this.logger.info(`asset id: ${id} already exists`);
        } else if (blocking) {
            await this._saveAndUpload({
                id, data, esData, blocking
            });
        } else {
            // kick this of in the background since it is not blocking
            try {
                await this._saveAndUpload({
                    id, data, esData, blocking
                });
            } catch (err) {
                this.logger.error(err, `Failure saving asset: ${id}`);
            }
        }

        return {
            assetId: id,
            created: !exists,
        };
    }

    // this will work, but wont return the blob containing the asset. It doesn't seem needed.
    // if blob is needed update to get the asset from s3, then convert it and put in the blob field?
    async search(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        fields?: string | string[]
    ): Promise<ClientResponse.SearchResponse<AssetRecord>> {
        return this.esBackend.search(
            query, from, size, sort, fields
        ) as unknown as ClientResponse.SearchResponse<AssetRecord>;
    }
    // this should be a SearchResponse as full_response is set to true in backendConfig
    // however for some reason the api ignores that for get and mget, and fullResponse
    // is an argument to the call itself, which can defy the config, defaults to false
    async get(id: string): Promise<AssetRecord> {
        if (this.s3Backend) {
            // does this bog down ES still, or is the query lighter w/o the blob????
            const record: AssetRecord = await this.esBackend.get(id);
            // get zipped asset
            const s3Data: Buffer = await this.s3Backend.get(id);
            // convert zip buffer to base 64
            const esData = s3Data.toString('base64');
            record.blob = esData;
            return record;
        } else {
            return this.esBackend.get(id);
        }
    }

    private async _getAssetId(assetIdentifier: string) {
        // is full _id
        if (assetIdentifier.length === 40) {
            const count = await this.esBackend.count(`id:"${assetIdentifier}"`);
            if (count === 1) return assetIdentifier;
        }

        const [name, version] = assetIdentifier.split(':');
        const sort = '_created:desc';
        const fields = ['id', 'name', 'version', 'platform', 'arch', 'node_version'];

        const response = await this.esBackend.search(
            `name:"${name}" AND ${toVersionQuery(version)}`,
            undefined,
            10000,
            sort,
            fields
        ) as unknown as ClientResponse.SearchResponse<AssetRecord>;

        const assets = response.hits.hits.map((doc) => doc._source);

        if (!assets.length) {
            throw new TSError(`No assets found for "${assetIdentifier}`, {
                statusCode: 404
            });
        }

        const found = findMatchingAsset(assets as AssetRecord[], name, version);

        if (!found) {
            const reason = getInCompatibilityReason(findSimilarAssets(assets as AssetRecord[], name, version), ', due to a potential');
            throw new TSError(`No asset found for "${assetIdentifier}"${reason}`, {
                statusCode: 404
            });
        }

        return found.id;
    }

    async parseAssetsArray(assetsArray: string[]) {
        return Promise.all(uniq(assetsArray).map(this._getAssetId.bind(this)));
    }

    async shutdown(forceShutdown: boolean) {
        this.logger.info('shutting asset store down.');
        return this.esBackend.shutdown(forceShutdown);
    }

    async remove(assetId: string) {
        try {
            await this.esBackend.get(assetId, undefined, ['name']);
        } catch (err) {
            if (toString(err).indexOf('Not Found')) {
                const error = new TSError(`Unable to find asset ${assetId}`, {
                    statusCode: 404
                });

                throw error;
            }
            throw err;
        }
        await this.esBackend.remove(assetId);
        await fse.remove(path.join(this.assetsPath, assetId));
    }

    private async ensureAssetDir() {
        if (!this.assetsPath || !isString(this.assetsPath)) {
            throw new Error('Asset Store requires a valid assetsPath');
        }

        try {
            return await fse.ensureDir(this.assetsPath);
        } catch (err) {
            throw new Error(`Failure to the ensure assets directory ${this.assetsPath}, for reason ${err.message}`);
        }
    }

    private async findAssetsToAutoload(autoloadDir: string) {
        const files = await fse.readdir(autoloadDir);

        return files.filter((fileName) => {
            const ext = path.extname(fileName);
            return ext === '.zip';
        });
    }

    async autoload() {
        // @ts-expect-error TODO: verify this parameter
        const autoloadDir = this.context.sysconfig.teraslice.autoload_directory;
        if (!autoloadDir || !fse.existsSync(autoloadDir)) return;

        const assets = await this.findAssetsToAutoload(autoloadDir);
        if (!assets || !assets.length) return;

        for (const asset of assets) {
            this.logger.info(`autoloading asset ${asset}...`);
            const assetPath = path.join(autoloadDir, asset);
            try {
                const result = await this.save(await fse.readFile(assetPath), true);
                if (result.created) {
                    this.logger.debug(`autoloaded asset ${asset}`);
                } else {
                    this.logger.debug(`autoloaded asset ${asset} already exists`);
                }
            } catch (err) {
                if (err.alreadyExists) {
                    this.logger.debug(`autoloaded asset ${asset} already exists`);
                } else {
                    throw err;
                }
            }
        }

        this.logger.info('done autoloading assets');
    }

    verifyClient() {
        return this.esBackend.verifyClient();
    }

    async waitForClient() {
        return this.esBackend.waitForClient();
    }
}
