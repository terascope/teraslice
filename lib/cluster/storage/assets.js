'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const crypto = require('crypto');
const _ = require('lodash');
const parseError = require('../../utils/error_utils').parseError;
const saveAsset = require('../../utils/file_utils').saveAsset;
const fse = require('fs-extra');
const normalizeZipFile = require('../../utils/file_utils').normalizeZipFile;


// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    const logger = context.foundation.makeLogger({ module: 'assets_storage' });
    const config = context.sysconfig.teraslice;
    const assetsPath = config.assets_directory;
    const indexName = `${config.name}__assets`;

    let backend;

    function save(data) {
        let metaData;
        const esData = data.toString('base64');
        const id = crypto.createHash('sha1').update(esData).digest('hex');
        return fs.openAsync(`${assetsPath}/${id}`, 'r')
            .then(() => {
                // directory exists, need to check if the index has it, if not then save it
                logger.debug(`asset ${id} exists, verifying that it exists in backend`);
                return backend.get(id, null, ['name'])
                // it exists, just return the id
                    .then(() => id)
                    .catch((err) => {
                        if (err === 'Not Found') {
                            logger.info(`asset: ${id} exists on disk but not in index, saving asset to index`);
                            return normalizeZipFile(id, `${assetsPath}/${id}`, logger)
                                .then((_metaData) => {
                                    metaData = _metaData;
                                    const fileData = { blob: esData, _created: new Date() };
                                    const file = _.assign(fileData, _metaData);
                                    return backend.indexWithId(id, file);
                                })
                                .then(() => {
                                    logger.info(`assets: ${metaData.name}, id: ${id} has been saved to elasticsearch`);
                                    return id;
                                });
                        }
                        return Promise.reject(`error checking asset index, could not get asset with id: ${id}`);
                    });
            })
            .catch((fileError) => {
                if (fileError.code === 'ENOENT') {
                    return Promise.resolve(saveAsset(logger, assetsPath, id, data, _metaIsUnqiue))
                        .then((_metaData) => {
                            metaData = _metaData;
                            const file = _.assign({ blob: esData, _created: new Date() }, metaData);
                            return backend.indexWithId(id, file);
                        })
                        .then(() => {
                            logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
                            return id;
                        })
                        .catch((err) => {
                            const errMsg = parseError(err);
                            logger.error(errMsg);
                            return Promise.reject(errMsg);
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
                    const record = assetRecord[0];
                    if (!record) {
                        return Promise.reject(`asset: ${metaData.join(' ')} was not found`);
                    }
                    return record._id;
                });
        }

        // has wildcard in version
        return search(`name:${metaData[0]} AND version:${metaData[1]}`, null, 10000, '_created:desc', ['version'])
            .then((assetRecords) => {
                const records = assetRecords.map(record => ({
                    id: record._id,
                    version: record._source.version
                }));

                const versionID = metaData[1];
                const wildcardPlacement = versionID.indexOf('*') - 1;
                const versionTransform = versionID.split('.');
                const versionWithWildcard = versionTransform.indexOf('*');
                const versionSlice = versionTransform.filter(chars => chars !== '*').join('.');

                if (records.length === 0) {
                    return Promise.reject(`No asset with the provided name and version could be located, asset: ${metaData.join(':')}`);
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
                if (results.length === 0) {
                    return meta;
                }

                return Promise.reject(`asset name:${meta.name} and version:${meta.version} already exists, please increment the version and send again`);
            });
    }

    function _registerContextAPI() {
        // This will register the API under context.apis.assets
        context.apis.registerAPI('assets', {
            getPath: _getPath
        });

        // FIXME: this form of the api call is deprecated and should be removed
        // prior to 1.0
        context.assets = {};
        context.assets.getPath = _getPath;
    }

    function _getPath(assetIdentifier) {
        return _getAssetId(assetIdentifier)
            .then(id => `${assetsPath}/${id}`);
    }

    function shutdown() {
        logger.info('shutting asset store down.');
        return backend.shutdown();
    }

    function remove(assetId) {
        return Promise.all([backend.remove(assetId), fse.remove(`${assetsPath}/${assetId}`)]);
    }

    const api = {
        save,
        search,
        get: getAsset,
        remove,
        parseAssetsArray,
        shutdown
    };

    return require('./backends/elasticsearch_store')(context, indexName, 'asset', '_id', null, true)
        .then((elasticsearch) => {
            backend = elasticsearch;

            _registerContextAPI();

            return api;
        });
};
