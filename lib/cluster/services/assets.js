'use strict';

var Promise = require('bluebird');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('assets_service', 'assets_service', {module: 'assets_service'});
    var assets_store;
    var messageModule = require('./messaging');
    var messaging = messageModule(context, logger);
    var parseError = require('../../utils/error_utils').parseError;
    var app = require('express')();

    var events = require('../../utils/events');

    app.post('/assets', function(req, res) {
        logger.info('loading an asset');
        var results = [];

        req.on('data', function(buff) {
            results.push(buff)
        });

        req.on('end', function() {
            var data = Buffer.concat(results);
            assets_store.save(data)
                .then(function(asset_id) {
                    res.json({_id: asset_id})
                })
                .catch(function(err) {
                    res.status(500).json({error: err})
                });
        });

        req.on('error', function(err) {
            res.status(500).send(err)
        })
    });

    app.delete('/assets/:asset_id', function(req, res) {
        var asset_id = req.params.asset_id;

        if (asset_id.length !== 40) {
            res.status(400).json({error: `asset ${asset_id} is not formatted correctly, please provide the full asset_id`})
        }
        else {
            assets_store.remove(asset_id)
                .then(function() {
                    res.status(200).json({asset_id: asset_id})
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`error while attempted to delete asset, error: ${errMsg}`);
                    res.status(500).json({error: `error while attempted to delete asset, error: ${errMsg}`})
                })
        }
    });


    Promise.resolve(require('../storage/assets')(context))
        .then(function(store) {
            assets_store = store;
            var port = process.env.port;
            logger.info(`assets_service is listening on port ${port}`);

            app.listen(port);
        })
        .catch(function(err) {
            var errMsg = parseError(err);
            logger.error(`Error while creating assets_service, error: ${errMsg}`);
            setTimeout(function() {
                process.exit(0)
            }, 10)
        });

};
