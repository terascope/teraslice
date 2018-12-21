'use strict';

const _ = require('lodash');
const express = require('express');
const Promise = require('bluebird');
const parseError = require('@terascope/error-parser');
const makeAssetsStore = require('../storage/assets');
const {
    makeTable,
    handleRequest,
    getSearchOptions,
    getErrorMsgAndCode,
    sendError,
} = require('../../utils/api_utils');

module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'assets_service' });
    const app = express();

    let assetsStore;
    let running = false;

    app.set('json spaces', 4);

    app.use((req, res, next) => {
        req.logger = logger;
        next();
    });

    app.get('/status', (req, res) => {
        const requestHandler = handleRequest(req, res);
        requestHandler(() => ({ available: running }));
    });

    app.post('/assets', (req, res) => {
        logger.info('loading an asset');
        const results = [];

        req.on('data', (buff) => {
            results.push(buff);
        });

        req.on('end', () => {
            const data = Buffer.concat(results);
            assetsStore.save(data)
                .then(({ assetId, created }) => {
                    const code = created ? 201 : 200;
                    res.status(code).json({
                        _id: assetId
                    });
                })
                .catch((err) => {
                    const { code, message } = getErrorMsgAndCode(err);
                    logger.error(err.message);
                    sendError(res, code, message);
                });
        });

        req.on('error', (err) => {
            const { code, message } = getErrorMsgAndCode(err);
            res.status(code).send(message);
        });
    });

    app.delete('/assets/:assetId', (req, res) => {
        const { assetId } = req.params;
        const requestHandler = handleRequest(req, res, `Could not delete asset ${assetId}`);

        if (assetId.length !== 40) {
            res.status(400).json({
                error: `asset ${assetId} is not formatted correctly, please provide the full asset_id`
            });
        } else {
            requestHandler(async () => {
                await assetsStore.remove(assetId);
                return { _id: assetId };
            });
        }
    });

    app.get('/txt/assets', (req, res) => {
        const query = 'id:*';
        createAssetTable(query, req, res);
    });

    app.get('/txt/assets/:name', (req, res) => {
        const query = `id:* AND name:${req.params.name}`;
        createAssetTable(query, req, res);
    });

    app.get('/txt/assets/:name/:version', (req, res) => {
        const query = `id:* AND name:${req.params.name} AND version:${req.params.version}`;
        createAssetTable(query, req, res);
    });

    app.get('/assets', (req, res) => {
        const query = 'id:*';
        assetsSearch(query, req, res);
    });

    app.get('/assets/:name', (req, res) => {
        const query = `id:* AND name:${req.params.name}`;
        assetsSearch(query, req, res);
    });

    app.get('/assets/:name/:version', (req, res) => {
        const query = `id:* AND name:${req.params.name} AND version:${req.params.version}`;
        assetsSearch(query, req, res);
    });

    function createAssetTable(query, req, res) {
        const { size, from, sort } = getSearchOptions(req, '_created:desc');

        const defaults = [
            'name',
            'version',
            'id',
            '_created',
            'description'
        ];

        function mapping(item) {
            return (field) => {
                if (field === 'description') {
                    return item[field] ? item[field].slice(0, 30) : item[field];
                }
                return item[field];
            };
        }

        const requestHandler = handleRequest(req, res, 'Could not get assets');
        requestHandler(async () => {
            const results = await assetsStore.search(query, from, size, sort, defaults);
            const data = results.hits.hits;
            const assets = _.map(data, (asset) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });
            return makeTable(req, defaults, assets, mapping);
        });
    }

    function assetsSearch(query, req, res) {
        const { size, from, sort } = getSearchOptions(req, '_created:desc');

        const requestHandler = handleRequest(req, res, 'Could not get assets');
        requestHandler(async () => {
            const fields = ['_created', 'name', 'version', 'description'];
            const results = await assetsStore.search(query, from, size, sort, fields);
            const data = results.hits.hits;
            return _.map(data, (asset) => {
                const record = asset._source;
                record.id = asset._id;
                return record;
            });
        });
    }


    return {
        initialize() {
            return Promise.resolve(makeAssetsStore(context))
                .then((store) => {
                    assetsStore = store;
                    return assetsStore.autoload();
                })
                .then(() => {
                    const { port } = process.env;
                    return new Promise((resolve, reject) => {
                        app.listen(port, (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            logger.info(`assets_service is listening on port ${port}`);
                            resolve();
                        });
                    });
                })
                .then(() => {
                    running = true;
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(`Error while creating assets_service, error: ${errMsg}`);
                    running = false;
                    return Promise.reject(err);
                });
        },
        run() {
            return new Promise((resolve) => {
                if (!running) {
                    resolve();
                    return;
                }
                const runningInterval = setInterval(() => {
                    if (!running) {
                        clearInterval(runningInterval);
                        resolve();
                    }
                }, 1000);
            });
        },
        shutdown() {
            running = false;
            if (!assetsStore) return Promise.resolve();
            return assetsStore.shutdown(true);
        }
    };
};
