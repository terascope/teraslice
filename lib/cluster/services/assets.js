'use strict';

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
                });
        });
        req.on('error', function(err) {
            res.status(500).send(err)
        })
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
