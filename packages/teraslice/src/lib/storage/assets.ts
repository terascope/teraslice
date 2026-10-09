import path from 'node:path';
import fse from 'fs-extra';
import crypto from 'node:crypto';
import {
    TSError, uniq, isString,
    filterObject, Logger, pDelay
} from '@terascope/core-utils';
import { Context } from '@terascope/job-components';
import { ClientResponse, AssetRecord } from '@terascope/types';
import { TerasliceElasticsearchStorage, TerasliceESStorageConfig } from './backends/elasticsearch_store.js';
import { S3Store, TerasliceS3StorageConfig } from './backends/s3_store.js';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { saveAsset, AssetMetadata, isZipFile, deleteDir } from '../utils/file_utils.js';
import {
    findMatchingAsset, findSimilarAssets, toVersionQuery,
    getInCompatibilityReason
} from '../utils/asset_utils.js';
import { HTTP_RESPONSE_MARGIN } from '../utils/api_utils.js';

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

export function getBackendConfig(context: Context, logger: Logger) {
    const { teraslice } = context.sysconfig;

    const connectionType = teraslice.asset_storage_connection_type;
    const storageConnection = teraslice.asset_storage_connection;
    const storageBucket = teraslice.asset_storage_bucket;

    /// Check teraslice first before setting to terafoundation configs
    const s3BackendConfig: TerasliceS3StorageConfig = {
        context,
        terafoundation: context.sysconfig.terafoundation,
        connection: storageConnection,
        bucket: storageBucket,
        logger
    };
    return { s3BackendConfig, assetConnectionType: connectionType };
}

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
export class AssetsStorage {
    readonly assetsPath: string;
    private esBackend: TerasliceElasticsearchStorage;
    private readonly context: Context;
    logger: Logger;
    private s3Backend?: S3Store;
    private readonly responseTimeout: number;

    constructor(context: Context) {
        const logger = makeLogger(context, 'assets_storage');
        const config = context.sysconfig.teraslice;
        const indexName = `${config.name}__assets`;

        const esBackendConfig: TerasliceESStorageConfig = {
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
        this.responseTimeout = this.context.sysconfig.teraslice.api_response_timeout
            - HTTP_RESPONSE_MARGIN;

        const { assetConnectionType, s3BackendConfig } = getBackendConfig(context, logger);
        if (assetConnectionType === 's3' && s3BackendConfig.connection) {
            this.s3Backend = new S3Store(s3BackendConfig);
        }
    }

    async initialize() {
        await this.ensureAssetDir();
        if (this.s3Backend) {
            await Promise.all([
                this.s3Backend.initialize(),
                this.esBackend.initialize()
            ]);
        } else {
            await this.esBackend.initialize();
        }
        this.logger.info('assets storage initialized');
    }

    private async _assetExistsInFS(id: string): Promise<boolean> {
        try {
            if (!this.assetsPath) return false;

            const access = fse.constants.F_OK | fse.constants.R_OK | fse.constants.W_OK;
            await fse.access(path.join(this.assetsPath, id), access);

            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * True if the asset's ES record exists and, when S3 is configured, its S3 object
     * exists too. A 404 from either backend returns false; any other error is thrown.
    */
    private async _assetExistsInStorage(id: string): Promise<boolean> {
        try {
            const inES = await this.esBackend.get(id, undefined, ['id', 'name']);
            if (this.s3Backend) {
                const inS3 = await this.s3Backend.exists(id);
                return inES != null && inS3;
            }
            return inES != null;
        } catch (err) {
            if (err.statusCode === 404) {
                return false;
            }
            throw new TSError(err, {
                reason: `Failure checking asset index, could not get asset with id: ${id}`
            });
        }
    }

    /**
     * True if any part of the asset (filesystem, ES record, or S3 object) remains.
     * Used by remove() so a partially deleted asset can still be found and cleaned up.
    */
    private async _assetExistsAnywhere(id: string): Promise<boolean> {
        const NOT_FOUND = new Error('asset not found');

        const rejectIfMissing = async (check: () => Promise<unknown>): Promise<boolean> => {
            if (!(await check())) throw NOT_FOUND;
            return true;
        };

        try {
            // resolves on the first check that finds the asset
            return await Promise.any([
                rejectIfMissing(async () => this._assetExistsInFS(id)),
                rejectIfMissing(async () => this.esBackend.get(id, undefined, ['id'])),
                rejectIfMissing(async () => this.s3Backend?.exists(id) ?? false)
            ]);
        } catch (err) {
            // every check rejected. A 404 or NOT_FOUND mean the check
            // was false. Throw all other errors.
            const realError = (err as AggregateError).errors.find(
                (e) => e !== NOT_FOUND && e.statusCode !== 404
            );
            if (realError) throw realError;
            return false;
        }
    }

    /**
     * True only if every part of the asset (filesystem, ES record, and S3 object
     * when configured) is present. Used by save() so a partially saved asset is
     * treated as missing and gets saved again.
    */
    private async _assetExists(id: string) {
        const [readable, exists] = await Promise.all([
            this._assetExistsInFS(id),
            this._assetExistsInStorage(id)
        ]);

        return readable && exists;
    }

    private async _saveToEs(
        id: string,
        assetRecord: Partial<AssetRecord>,
        blocking: boolean,
        responseTimeout: number,
        startTime: number
    ) {
        if (blocking) {
            const elapsed = Date.now() - startTime;
            const remaining = responseTimeout - elapsed;
            await this.esBackend.indexWithId(id, assetRecord, undefined, remaining);
        } else {
            await this.esBackend.indexWithId(id, assetRecord, undefined, responseTimeout);
        }
    }

    // data is the buffer form of asset, stored in filesystem
    // esData is the base64 version which is stored in elasticsearch
    private async _saveAndUpload({
        id, data, esData, blocking
    }: { id: string; data: Buffer; esData: string; blocking: boolean }) {
        const startTime = Date.now();

        const metaData = await saveAsset(
            this.logger,
            this.assetsPath,
            id,
            data,
            _metaIsUnique(this.esBackend)
        );

        const assetRecord = Object.assign({
            blob: esData,
            _created: new Date().toISOString()
        }, metaData);

        await this._saveToEs(id, assetRecord, blocking, this.responseTimeout, startTime);
        this.logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
    }

    private async _saveAndUploadS3({
        id, data, blocking
    }: { id: string; data: Buffer; blocking: boolean }) {
        const startTime = Date.now();

        try {
            if (this.s3Backend) {
                if (blocking) {
                    const elapsed = Date.now() - startTime;
                    const remaining = this.responseTimeout - elapsed;
                    await this.s3Backend.save(id, data, remaining);
                } else {
                    await this.s3Backend.save(id, data, this.responseTimeout);
                }

                this.logger.info(`asset id: ${id} has been saved to s3 store`);
            }

            const metaData = await saveAsset(
                this.logger,
                this.assetsPath,
                id,
                data,
                _metaIsUnique(this.esBackend)
            );

            const assetRecord = Object.assign({
                _created: new Date().toISOString()
            }, metaData);

            await this._saveToEs(id, assetRecord, blocking, this.responseTimeout, startTime);
            this.logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
        } catch (err) {
            // clean up s3 object or saved asset if a later step fails
            await this.s3Backend?.remove(id);
            await deleteDir(path.join(this.assetsPath, id));
            throw err;
        }
    }

    /**
     * Save an asset to disk and upload to elasticsearch or s3
     *
     * @param {Buffer}         data A buffer of the asset file (zipped)
     * @param {boolean=true}   blocking If false, save the asset in the background
     * @returns {Promise<{ assetId: string; created: boolean }>}
    */
    async save(data: Buffer, blocking = true) {
        if (!isZipFile(data)) {
            throw new Error('Failed to save asset. File type not recognized as zip.');
        }
        const esData = data.toString('base64');
        const id = crypto.createHash('sha1').update(esData)
            .digest('hex');

        const exists = await this._assetExists(id);

        if (exists) {
            this.logger.info(`asset id: ${id} already exists`);
        } else if (blocking && this.s3Backend) {
            await this._saveAndUploadS3({
                id, data, blocking
            });
        } else if (blocking && !this.s3Backend) {
            await this._saveAndUpload({
                id, data, esData, blocking
            });
        } else {
            // kick this of in the background since it is not blocking
            try {
                if (this.s3Backend) {
                    await this._saveAndUploadS3({
                        id, data, blocking
                    });
                } else {
                    await this._saveAndUpload({
                        id, data, esData, blocking
                    });
                }
            } catch (err) {
                this.logger.error(err, `Failure saving asset: ${id}`);
            }
        }

        return {
            assetId: id,
            created: !exists,
        };
    }

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

    /*
     * Get all the asset records out of the S3 bucket
     * Returns an array of Records containing: { File: any, Size: any }
    */
    async grabS3Info(): Promise<Record<string, any>[]> {
        return await this.s3Backend?.list() as Record<string, any>[];
    }

    // this should be a SearchResponse as full_response is set to true in backendConfig
    // however for some reason the api ignores that for get and mget, and fullResponse
    // is an argument to the call itself, which can defy the config, defaults to false
    async get(id: string): Promise<AssetRecord> {
        let record;
        if (this.s3Backend) {
            record = await this.esBackend.get(id);
            record.blob = await this.s3Backend.get(id);
        } else {
            record = this.esBackend.get(id);
        }
        return record;
    }

    /**
     * Stream an asset's blob from the S3 backend straight to a file on disk,
     * avoiding buffering the whole asset in memory. Only valid when an S3
     * backend is configured.
     */
    async getToFile(id: string, destPath: string): Promise<void> {
        if (!this.s3Backend) {
            throw new TSError('getToFile is only supported when an S3 asset backend is configured');
        }
        await this.s3Backend.getToFile(id, destPath);
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
            throw new TSError(`No assets found for "${assetIdentifier}"`, {
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
        if (this.s3Backend) {
            return Promise.all([
                this.esBackend.shutdown(forceShutdown),
                this.s3Backend.shutdown()
            ]);
        }
        return Promise.all([
            this.esBackend.shutdown(forceShutdown)
        ]);
    }

    async remove(assetId: string) {
        if (!await this._assetExistsAnywhere(assetId)) {
            throw new TSError(`Unable to find asset ${assetId}`, {
                statusCode: 404
            });
        }
        let delayMS = 100;
        let lastError: unknown;
        const deadline = Date.now() + this.responseTimeout;
        while (true) {
            try {
                if (this.s3Backend) {
                    await this.s3Backend.remove(assetId);
                }
                await fse.remove(path.join(this.assetsPath, assetId));
                // ES record is removed last so a failed delete leaves the asset
                // listed in the API and a retry can find it
                try {
                    await this.esBackend.remove(assetId);
                } catch (err) {
                    if (err.statusCode !== 404) throw err;
                }

                if (!await this._assetExistsAnywhere(assetId)) return;
            } catch (err) {
                lastError = err;
                this.logger.error(err, `Failure deleting asset ${assetId}: ${err}`);
            }

            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                throw new TSError(lastError ?? `Asset ${assetId} still exists after delete`, {
                    reason: `Timeout deleting asset ${assetId} after ${this.responseTimeout}ms`,
                    statusCode: 504
                });
            }
            await pDelay(Math.min(delayMS, remaining));
            if (delayMS < 30000) delayMS *= 2;
        }
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
        if (this.s3Backend) {
            return this.esBackend.verifyClient() && this.s3Backend.verifyClient();
        }
        return this.esBackend.verifyClient();
    }

    async waitForClient() {
        if (this.s3Backend) {
            return Promise.all([this.esBackend.waitForClient(), this.s3Backend.waitForClient()]);
        }
        return this.esBackend.waitForClient();
    }
}
