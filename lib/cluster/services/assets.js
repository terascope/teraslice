'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const VError = require('verror');
const express = require('express');
const messageModule = require('./messaging');
const { makeTable, respondWithError } = require('../../utils/api_utils');
const { logError } = require('../../utils/error_utils');

module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'assets_service' });
    const messaging = messageModule(context, logger);
    const app = express();

    let assetsStore;

    messaging.register({
        event: 'worker:shutdown',
        callback: () => {
            Promise.resolve(assetsStore.shutdown())
                .then(() => process.exit)
                .catch((err) => {
                    const error = new VError(err, 'failed to shutdown asset_service');
                    logError(logger, error);
                    setTimeout(() => process.exit(), 100);
                });
        }
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
                .then((assetId) => {
                    res.json({ _id: assetId });
                })
                .catch((err) => {
                    respondWithError(res, logger, err);
                });
        });

        req.on('error', (err) => {
            const error = new VError(err, 'failed parse asset stream');
            respondWithError(res, logger, error);
        });
    });

    app.delete('/assets/:asset_id', (req, res) => {
        const assetId = req.params.asset_id;

        if (assetId.length !== 40) {
            const error = new VError('asset %s is not formatted correctly, please provide the full asset_id', assetId);
            error.statusCode = 400;
            respondWithError(res, logger, error);
            return;
        }

        assetsStore.remove(assetId)
            .then(() => {
                res.status(200).json({ assetId });
            })
            .catch((err) => {
                const error = new VError(err, 'Could not delete asset %s', assetId);
                respondWithError(res, logger, error);
            });
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
        assetsSearch(query, req, res)
            .then(results => res.status(200).json(results));
    });

    app.get('/assets/:name', (req, res) => {
        const query = `id:* AND name:${req.params.name}`;
        assetsSearch(query, req, res)
            .then(results => res.status(200).json(results));
    });

    app.get('/assets/:name/:version', (req, res) => {
        const query = `id:* AND name:${req.params.name} AND version:${req.params.version}`;
        assetsSearch(query, req, res)
            .then(results => res.status(200).json(results));
    });

    Promise.resolve(require('../storage/assets')(context))
        .then((store) => {
            assetsStore = store;
            const { port } = process.env;
            logger.info(`assets_service is listening on port ${port}`);
            app.listen(port);
            return messaging.send({ to: 'cluster_master', message: 'assets:service:available' });
        })
        .catch((err) => {
            const error = new VError(err, 'failure while creating assets_service');
            logError(logger, error);

            return messaging.send({
                to: 'cluster_master',
                message: 'assets:service:available',
                error: error.message,
            }).finally(() => Promise.delay(100)
                .then(() => process.exit(0)));
        });

    function createAssetTable(query, req, res) {
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

        assetsSearch(query, res, res)
            .then((queryResults) => {
                const tableStr = makeTable(req, defaults, queryResults, mapping);
                res.status(200).send(tableStr);
            });
    }

    function assetsSearch(query, req, res) {
        return assetsStore.search(query, null, 10000, '_created:desc', ['_created', 'name', 'version', 'description'])
            .then((results) => {
                const data = results.hits.hits;
                return _.map(data, (asset) => {
                    const record = asset._source;
                    record.id = asset._id;
                    return record;
                });
            })
            .catch((err) => {
                const error = new VError(err, 'Could not get assets');
                respondWithError(res, logger, error);
            });
    }
};
