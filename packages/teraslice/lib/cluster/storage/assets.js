'use strict';

const _ = require('lodash');
const path = require('path');
const fse = require('fs-extra');
const crypto = require('crypto');
const Promise = require('bluebird');
const { TSError, pDelay, uniq } = require('@terascope/utils');
const elasticsearchBackend = require('./backends/elasticsearch_store');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const { saveAsset } = require('../../utils/file_utils');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = async function assetsStore(context) {
    const logger = makeLogger(context, 'assets_storage');
    const config = context.sysconfig.teraslice;
    const assetsPath = config.assets_directory;
    const indexName = `${config.name}__assets`;

    let backend;

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

    async function save(data) {
        try {
            const esData = data.toString('base64');
            const id = crypto.createHash('sha1').update(esData).digest('hex');

            const exists = await _assetExists(id);
            if (exists) {
                logger.info(`asset id: ${id} already exists`);
            } else {
                const metaData = await saveAsset(logger, assetsPath, id, data, _metaIsUnqiue);

                const assetRecord = Object.assign({
                    blob: esData,
                    _created: new Date().toISOString()
                }, metaData);

                await backend.indexWithId(id, assetRecord);

                logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
            }

            return {
                assetId: id,
                created: !exists,
            };
        } catch (err) {
            return err;
        }
    }

    function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort, fields);
    }

    function getAsset(id) {
        return backend.get(id);
    }

    function _getAssetId(assetIdentifier) {
        // is full _id
        if (assetIdentifier.length === 40) {
            // need to return a promise
            return Promise.resolve(assetIdentifier);
        }

        const metaData = assetIdentifier.split(':');
        const sort = '_created:desc';
        const fields = ['version'];

        // if no version specified get latest
        if (metaData.length === 1 || metaData[1] === 'latest') {
            return search(`name:"${metaData[0]}"`, null, 1, sort, fields)
                .then((assetRecord) => {
                    const record = assetRecord.hits.hits[0];
                    if (!record) {
                        const error = new Error(`asset: ${metaData.join(' ')} was not found`);
                        return Promise.reject(error);
                    }
                    return record._id;
                });
        }

        // has wildcard in version
        return search(`name:"${metaData[0]}" AND version:"${metaData[1]}"`, null, 10000, sort, fields)
            .then((assetRecords) => {
                const records = assetRecords.hits.hits.map((record) => ({
                    id: record._id,
                    version: record._source.version
                }));

                const versionID = metaData[1];
                const wildcardPlacement = versionID.indexOf('*') - 1;
                const versionTransform = versionID.split('.');
                const versionWithWildcard = versionTransform.indexOf('*');
                const versionSlice = versionTransform.filter((chars) => chars !== '*').join('.');

                if (records.length === 0) {
                    const error = new Error(`No asset with the provided name and version could be located, asset: ${metaData.join(':')}`);
                    return Promise.reject(error);
                }

                return records.reduce((prev, curr) => _compareVersions(
                    prev,
                    curr,
                    wildcardPlacement,
                    versionSlice,
                    versionWithWildcard
                )).id;
            });
    }

    function parseAssetsArray(assetsArray) {
        return Promise.all(uniq(assetsArray).map(_getAssetId));
    }

    function _compareVersions(prev, curr, wildcardPlacement, versionSlice, versionWithWildcard) {
        const prevBool = prev.version.slice(0, wildcardPlacement) === versionSlice;
        const currBool = curr.version.slice(0, wildcardPlacement) === versionSlice;

        // if they both match up to wildcard
        if (prevBool && currBool) {
            const prevVersion = prev.version.split('.');
            const currVersion = curr.version.split('.');
            const prevParsedNumber = Number(prevVersion[versionWithWildcard]);
            const currParsedNumber = Number(currVersion[versionWithWildcard]);

            if (prevParsedNumber < currParsedNumber) {
                return curr;
            }
            return prev;
        }

        if (prevBool && !currBool) {
            return prev;
        }

        return curr;
    }

    async function _metaIsUnqiue(meta) {
        const results = await search(`name:${meta.name} AND version:${meta.version}`, null, 10000);
        if (results.hits.hits.length === 0) {
            return meta;
        }

        const error = new TSError(`asset name:${meta.name} and version:${meta.version} already exists, please increment the version and send again`, {
            statusCode: 409
        });
        error.code = 409;
        error.alreadyExists = true;
        throw error;
    }

    function shutdown(forceShutdown) {
        logger.info('shutting asset store down.');
        return backend.shutdown(forceShutdown);
    }

    async function remove(assetId) {
        try {
            await backend.get(assetId, null, ['name']);
        } catch (err) {
            if (_.toString(err).indexOf('Not Found')) {
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
        if (!assetsPath || !_.isString(assetsPath)) {
            throw new Error('Asset Store requires a valid assetsPath');
        }

        try {
            return fse.ensureDir(assetsPath);
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

        const promises = assets.map(async (asset, i) => {
            await pDelay(i * 100);

            logger.info(`autoloading asset ${asset}...`);
            const assetPath = path.join(autoloadDir, asset);
            try {
                const result = await save(await fse.readFile(assetPath));
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
        });

        await Promise.all(promises);

        logger.info('done autoloading assets');
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    function waitForClient() {
        return backend.waitForClient();
    }

    const api = {
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
    backend = await elasticsearchBackend(backendConfig);

    logger.info('assets storage initialized');
    return api;
};
