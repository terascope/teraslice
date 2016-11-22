'use strict';

var Promise = require('bluebird');
var makeLogs = require('./storage/logs');
var messageModule = require('./services/messaging');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('cluster_master', 'cluster_master', {module: 'cluster_master'});
    var clusterConfig = context.sysconfig.teraslice;
    var elasticError = require('../utils/error_utils').elasticError;
    var event = require('../utils/events');

    // Initialize the HTTP service for handling incoming requests.
    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    logger.info(`listening on port ${clusterConfig.port}`);

    var messaging = messageModule(context, logger);
    context.messaging = messaging;

    var services = [];

    require('./services/cluster')(context, server)
        .then(function(cluster_service) {
            logger.trace('cluster_service has instantiated');
            services.push(cluster_service);
            return require('./services/jobs')(context, cluster_service)
                .then(function(jobs_service) {
                    logger.trace('jobs_service has instantiated');
                    services.push(jobs_service);
                    return require('./services/api')(context, app, cluster_service, jobs_service);
                })
                .then(function(api_service) {
                    logger.trace('api_service has instantiated');
                    services.push(api_service);
                    return makeLogs(context);
                });
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error("error during service initialization", errMsg);
            messaging.send({message: 'cluster:error:terminal'});
        });

    event.on('cluster_master:shutdown', function() {
        //Would there be sequencing required here?
        logger.debug('cluster_master is shutting down');
        var shuttingdown = [];
        services.forEach(function(service) {
            shuttingdown.push(service.shutdown());
        });

        Promise
            .all(shuttingdown)
            .then(function() {
                logger.trace('flushing the logger before exit');
                return logger.flush();
            })
            .then(function() {
                process.exit();
            });
    });

};
