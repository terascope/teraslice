'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const crypto = require('crypto');
const path = require('path');
const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const fse = require('fs-extra');
const { saveAsset } = require('../../utils/file_utils');
const elasticsearchBackend = require('./backends/elasticsearch_store');


// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'assets_storage' });
    const config = context.sysconfig.teraslice;
    const assetsPath = config.assets_directory;
    const indexName = `${config.name}__assets`;

    let backend;

    function save(data) {
        let metaData;
        const esData = data.toString('base64');
        const id = crypto.createHash('sha1').update(esData).digest('hex');
        return fs.openAsync(path.join(assetsPath, id), 'r')
            .then(() => {
                // directory exists, need to check if the index has it, if not then save it
                logger.debug(`asset ${id} exists, verifying that it exists in backend`);
                return backend.get(id, null, ['name'])
                    // it exists, just return the id
                    .then(() => id)
                    .catch((err) => {
                        const error = new Error(`Failure checking asset index, could not get asset with id: ${id}, error: ${parseError(err)}`);
                        return Promise.reject(error);
                    });
            })
            .catch((fileError) => {
                if (fileError.code === 'ENOENT') {
                    return saveAsset(logger, assetsPath, id, data, _metaIsUnqiue)
                        .then((_metaData) => {
                            metaData = _metaData;
                            const file = _.assign({ blob: esData, _created: new Date() }, metaData);
                            return backend.indexWithId(id, file);
                        })
                        .then(() => {
                            logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
                            return id;
                        });
                }

                return Promise.reject(fileError);
            });
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

        // if no version specified get latest
        if (metaData.length === 1 || metaData[1] === 'latest') {
            return search(`name:${metaData[0]}`, null, 1, '_created:desc')
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
        return search(`name:${metaData[0]} AND version:${metaData[1]}`, null, 10000, '_created:desc', ['version'])
            .then((assetRecords) => {
                const records = assetRecords.hits.hits.map(record => ({
                    id: record._id,
                    version: record._source.version
                }));

                const versionID = metaData[1];
                const wildcardPlacement = versionID.indexOf('*') - 1;
                const versionTransform = versionID.split('.');
                const versionWithWildcard = versionTransform.indexOf('*');
                const versionSlice = versionTransform.filter(chars => chars !== '*').join('.');

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
        return Promise.map(assetsArray, _getAssetId);
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

    function _metaIsUnqiue(meta) {
        return search(`name:${meta.name} AND version:${meta.version}`, null, 10000)
            .then((results) => {
                if (results.hits.hits.length === 0) {
                    return meta;
                }
                const error = new Error(`asset name:${meta.name} and version:${meta.version} already exists, please increment the version and send again`);
                error.code = 409;
                error.alreadyExists = true;
                return Promise.reject(error);
            });
    }

    function shutdown(forceShutdown) {
        logger.info('shutting asset store down.');
        return backend.shutdown(forceShutdown);
    }

    function remove(assetId) {
        return Promise.all([
            backend.remove(assetId),
            fse.remove(path.join(assetsPath, assetId))
        ]);
    }

    function ensureAssetDir() {
        if (!assetsPath || !_.isString(assetsPath)) {
            return Promise.reject(new Error('Asset Store requires a valid assetsPath'));
        }

        return fse.ensureDir(assetsPath)
            .catch((err) => {
                const error = new Error(`Failure to the ensure assets directory ${assetsPath}, for reason ${err.message}`);
                return Promise.reject(error);
            });
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
        if (!autoloadDir || !fse.pathExistsSync(autoloadDir)) return;

        const assets = await findAssetsToAutoload(autoloadDir);

        const promises = assets.map(async (asset) => {
            logger.info(`autoloading asset ${asset}...`);
            const assetPath = path.join(autoloadDir, asset);
            try {
                await save(await fse.readFile(assetPath));
            } catch (err) {
                if (err.alreadyExists) {
                    logger.debug(`autoloaded asset ${asset} already exists`);
                } else {
                    throw err;
                }
            }
        });

        await Promise.all(promises);
    }


    const api = {
        save,
        search,
        get: getAsset,
        remove,
        autoload,
        parseAssetsArray,
        shutdown
    };

    return ensureAssetDir()
        .then(() => elasticsearchBackend(context, indexName, 'asset', '_id', null, true))
        .then((elasticsearch) => {
            backend = elasticsearch;
            return api;
        });
};
