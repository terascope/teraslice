'use strict';

var Promise = require('bluebird');
var makeLogs = require('./storage/logs');

module.exports = function(context) {
    var logger = context.foundation.makeLogger('cluster_master', 'cluster_master', {module: 'cluster_master'});
    var messaging = require('./services/messaging');
    var clusterConfig = context.sysconfig.teraslice;
    var elasticError = require('../utils/error_utils').elasticError;
    var event = require('../utils/events');

    var ipc = messaging({type: 'process', isClient: true});

    // Initialize the HTTP service for handling incoming requests.
    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    logger.info(`listening on port ${clusterConfig.port}`);

    var services = [];

    //event can be fired from anything that instantiates a client, such as stores
    event.on('client config error', terminalShutdown);

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
                    return makeLogs(context);
                });
        })
        .catch(function(err) {
            var errMsg = elasticError(err);
            logger.error("error during service initialization", errMsg);
            ipc.send({message: 'error:terminal'});
        });

    ipc.register('message', function(msg) {
        if (msg.message === 'shutdown') {
            //Would there be sequencing required here?
            var shuttingdown = [];
            services.forEach(function(service) {
                shuttingdown.push(service.shutdown());
            });

            Promise
                .all(shuttingdown)
                .then(function() {
                    return logger.flush();
                })
                .then(function() {
                    process.exit();
                });
        }
    });


    //to catch signal propagation, but cleanup through msg sent from master
    function noOP() {
    }

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: ${errEV.err}`);
        ipc.send({message: 'error:terminal'});
    }

    ipc.register('SIGTERM', noOP);
    ipc.register('SIGINT', noOP);
    
    ipc.initialize();

};
