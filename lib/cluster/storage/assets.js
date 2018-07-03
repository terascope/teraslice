'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const crypto = require('crypto');
const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const { saveAsset, normalizeZipFile } = require('../../utils/file_utils');
const fse = require('fs-extra');
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
        return fs.openAsync(`${assetsPath}/${id}`, 'r')
            .then(() => {
                // directory exists, need to check if the index has it, if not then save it
                logger.debug(`asset ${id} exists, verifying that it exists in backend`);
                return backend.get(id, null, ['name'])
                // it exists, just return the id
                    .then(() => id)
                    .catch((err) => {
                        if (_recoverableError(err)) {
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
                        return Promise.reject(`error checking asset index, could not get asset with id: ${id}, error: ${parseError(err)}`);
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

    function _recoverableError(error) {
        return typeof error === 'string' && (error.includes('Not Found') || error.includes('index_not_found_exception,'));
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
                        return Promise.reject(`asset: ${metaData.join(' ')} was not found`);
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
                if (results.hits.hits.length === 0) {
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

    function destroy(timeoutMs) {
        logger.info('destroying asset store');
        return backend.destroy(timeoutMs);
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
        destroy,
        shutdown
    };

    return elasticsearchBackend(context, indexName, 'asset', '_id', null, true)
        .then((elasticsearch) => {
            backend = elasticsearch;

            _registerContextAPI();

            return api;
        });
};
