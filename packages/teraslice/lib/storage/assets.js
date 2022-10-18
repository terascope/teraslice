import path from 'path';
import fse from 'fs-extra';
import crypto from 'crypto';
import {
    TSError, uniq, isString,
    toString, filterObject
} from '@terascope/utils';
import elasticsearchBackend from './backends/elasticsearch_store.js';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { saveAsset } from '../utils/file_utils.js';
import {
    findMatchingAsset, findSimilarAssets,
    toVersionQuery, getInCompatibilityReason
} from ('../utils/asset_utils');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
export default async function assetsStore(context) {
    const logger = makeLogger(context, 'assets_storage');
    const config = context.sysconfig.teraslice;
    const assetsPath = config.assets_directory;
    const indexName = `${config.name}__assets`;

    const backendConfig = {
        context,
        indexName,
        recordType: 'asset',
        idField: 'id',
        fullResponse: true,
        logRecord: false,
        storageName: 'assets'
    };

    await ensureAssetDir();
    const backend = await elasticsearchBackend(backendConfig);

    async function _assetExistsInFS(id) {
        try {
            // eslint-disable-next-line no-bitwise
            const access = fse.constants.F_OK | fse.constants.R_OK | fse.constants.W_OK;
            await fse.access(path.join(assetsPath, id), access);
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _assetExistsInES(id) {
        try {
            const result = await backend.get(id, null, ['id', 'name']);
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

    async function _assetExists(id) {
        const readable = await _assetExistsInFS(id);
        const exists = await _assetExistsInES(id);
        return readable && exists;
    }

    async function _saveAndUpload({
        id, data, esData, blocking
    }) {
        const startTime = Date.now();
        const metaData = await saveAsset(logger, assetsPath, id, data, _metaIsUnique);

        const assetRecord = Object.assign({
            blob: esData,
            _created: new Date().toISOString()
        }, metaData);

        if (blocking) {
            const elapsed = Date.now() - startTime;
            const remaining = config.api_response_timeout - elapsed;
            await backend.indexWithId(id, assetRecord, undefined, remaining);
        } else {
            await backend.indexWithId(id, assetRecord, undefined, config.api_response_timeout);
        }

        logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
    }

    /**
     * Save an asset to disk and upload to elasticsearch
     *
     * @param data {Buffer} A buffer of the asset file (zipped)
     * @param blocking {boolean=true} If false, save the asset in the background
     * @returns {Promise<{ assetId: string; created: boolean }>}
    */
    async function save(data, blocking = true) {
        const esData = data.toString('base64');
        const id = crypto.createHash('sha1').update(esData).digest('hex');

        const exists = await _assetExists(id);
        if (exists) {
            logger.info(`asset id: ${id} already exists`);
        } else if (blocking) {
            await _saveAndUpload({
                id, data, esData, blocking
            });
        } else {
            // kick this of in the background since it is not blocking
            _saveAndUpload({
                id, data, esData, blocking
            }).catch((err) => {
                logger.error(err, `Failure saving asset: ${id}`);
            });
        }

        return {
            assetId: id,
            created: !exists,
        };
    }

    async function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort, fields);
    }

    async function getAsset(id) {
        return backend.get(id);
    }

    async function _getAssetId(assetIdentifier) {
        // is full _id
        if (assetIdentifier.length === 40) {
            const count = await backend.count(`id:"${assetIdentifier}"`);
            if (count === 1) return assetIdentifier;
        }

        const [name, version] = assetIdentifier.split(':');
        const sort = '_created:desc';
        const fields = ['id', 'name', 'version', 'platform', 'arch', 'node_version'];

        const response = await search(
            `name:"${name}" AND ${toVersionQuery(version)}`, null, 10000, sort, fields
        );
        const assets = response.hits.hits.map((doc) => doc._source);

        const found = findMatchingAsset(assets, name, version);
        if (!found) {
            const reason = getInCompatibilityReason(findSimilarAssets(assets, name, version), ', due to a potential');
            throw new TSError(`No asset found for "${assetIdentifier}"${reason}`, {
                statusCode: 404
            });
        }
        return found.id;
    }

    function parseAssetsArray(assetsArray) {
        return Promise.all(uniq(assetsArray).map(_getAssetId));
    }

    async function _metaIsUnique(meta) {
        const includes = ['name', 'version', 'node_version', 'platform', 'arch'];

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
        error.code = 409;
        error.alreadyExists = true;
        throw error;
    }

    async function shutdown(forceShutdown) {
        logger.info('shutting asset store down.');
        return backend.shutdown(forceShutdown);
    }

    async function remove(assetId) {
        try {
            await backend.get(assetId, null, ['name']);
        } catch (err) {
            if (toString(err).indexOf('Not Found')) {
                const error = new TSError(`Unable to find asset ${assetId}`, {
                    statusCode: 404
                });
                error.code = 404;
                throw error;
            }
            throw err;
        }
        await backend.remove(assetId);
        await fse.remove(path.join(assetsPath, assetId));
    }

    async function ensureAssetDir() {
        if (!assetsPath || !isString(assetsPath)) {
            throw new Error('Asset Store requires a valid assetsPath');
        }

        try {
            return await fse.ensureDir(assetsPath);
        } catch (err) {
            throw new Error(`Failure to the ensure assets directory ${assetsPath}, for reason ${err.message}`);
        }
    }

    async function findAssetsToAutoload(autoloadDir) {
        const files = await fse.readdir(autoloadDir);

        return files.filter((fileName) => {
            const ext = path.extname(fileName);
            return ext === '.zip';
        });
    }

    async function autoload() {
        const autoloadDir = context.sysconfig.teraslice.autoload_directory;
        if (!autoloadDir || !fse.existsSync(autoloadDir)) return;

        const assets = await findAssetsToAutoload(autoloadDir);
        if (!assets || !assets.length) return;

        for (const asset of assets) {
            logger.info(`autoloading asset ${asset}...`);
            const assetPath = path.join(autoloadDir, asset);
            try {
                const result = await save(await fse.readFile(assetPath), true);
                if (result.created) {
                    logger.debug(`autoloaded asset ${asset}`);
                } else {
                    logger.debug(`autoloaded asset ${asset} already exists`);
                }
            } catch (err) {
                if (err.alreadyExists) {
                    logger.debug(`autoloaded asset ${asset} already exists`);
                } else {
                    throw err;
                }
            }
        }

        logger.info('done autoloading assets');
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    async function waitForClient() {
        return backend.waitForClient();
    }

    logger.info('assets storage initialized');
    return {
        save,
        search,
        get: getAsset,
        remove,
        autoload,
        parseAssetsArray,
        shutdown,
        waitForClient,
        verifyClient,
    };
};
