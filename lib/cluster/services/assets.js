'use strict';

const Promise = require('bluebird');
const makeTable = require('../../utils/api_utils').makeTable;
const sendError = require('../../utils/api_utils').sendError;
const _ = require('lodash');

module.exports = function (context) {
    const logger = context.foundation.makeLogger({ module: 'assets_service' });
    let assetsStore;
    const messageModule = require('./messaging');
    // TODO I should use messaging
    const messaging = messageModule(context, logger);
    const parseError = require('../../utils/error_utils').parseError;
    const app = require('express')();


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
                    res.status(500).json({ error: err });
                });
        });

        req.on('error', (err) => {
            res.status(500).send(err);
        });
    });

    app.delete('/assets/:asset_id', (req, res) => {
        const assetId = req.params.asset_id;

        if (assetId.length !== 40) {
            res.status(400).json({ error: `asset ${assetId} is not formatted correctly, please provide the full asset_id` });
        } else {
            assetsStore.remove(assetId)
                .then(() => {
                    res.status(200).json({ assetId });
                })
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(`error while attempted to delete asset, error: ${errMsg}`);
                    res.status(500).json({ error: `error while attempted to delete asset, error: ${errMsg}` });
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


    Promise.resolve(require('../storage/assets')(context))
        .then((store) => {
            assetsStore = store;
            const port = process.env.port;
            logger.info(`assets_service is listening on port ${port}`);
            app.listen(port);
            messaging.send({ message: 'assets:service:available' });
        })
        .catch((err) => {
            const errMsg = parseError(err);
            logger.error(`Error while creating assets_service, error: ${errMsg}`);
            messaging.send({ message: 'assets:service:available', error: errMsg });
            setTimeout(() => process.exit(0), 100);
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
            return function (field) {
                if (field === 'description') {
                    return item[field] ? item[field].slice(0, 30) : item[field];
                }
                return item[field];
            };
        }

        assetsStore.search(query, null, 10000, '_created:desc', ['_created', 'name', 'version', 'description'])
            .then((results) => {
                const transform = _.map(results.hits.hits, (asset) => {
                    const record = asset._source;
                    record.id = asset._id;
                    return record;
                });
                const tableStr = makeTable(req, defaults, transform, mapping);
                res.status(200).send(tableStr);
            })
            .catch((err) => {
                const code = err.code ? err.code : 500;
                sendError(res, code, err.message);
            });
    }
};
