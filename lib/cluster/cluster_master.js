'use strict';

var Promise = require('bluebird');

module.exports = function(context) {
    var logger = context.logger;
    var clusterConfig = context.sysconfig.teraslice;
    var elasticError = require('../utils/error_utils').elasticError;

    // Initialize the HTTP service for handling incoming requests.
    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    logger.info(`ClusterMaster: listening on port ${clusterConfig.port}`);

    var services = [];

    require('./services/cluster')(context, server)
        .then(function(cluster_service) {
            services.push(cluster_service);
            return require('./services/jobs')(context, cluster_service)
                .then(function(jobs_service) {
                    services.push(jobs_service);
                    return require('./services/api')(context, app, cluster_service, jobs_service);
                })
                .then(function(api_service) {
                    services.push(api_service);
                });
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error("ClusterMaster: error during service initialization", errMsg);
            process.send({message: 'error:terminal'});
        });

    process.on('message', function(msg) {
        if (msg.message === 'shutdown') {
            //Would there be sequencing required here?
            var shuttingdown = [];
            services.forEach(function(service) {
                shuttingdown.push(service.shutdown());
            });

            Promise
                .all(shuttingdown)
                .then(function() {
                    process.exit();
                });
        }
    });


    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    process.on('SIGTERM', noOP);
    process.on('SIGINT', noOP);

};
