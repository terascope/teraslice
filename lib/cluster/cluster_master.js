'use strict';

module.exports = function(context) {
    var logger = context.logger;
    var clusterConfig = context.sysconfig.teraslice.cluster;

    // Initialize the HTTP service for handling incoming requests.
    var app = require('express')();
    var server = app.listen(clusterConfig.port);
    logger.info('Cluster master is listening on port ' + clusterConfig.port);

    // Cluster communications and state management
    var cluster_service = require('./services/cluster')(context, server);

    // Job scheduling and state management
    var jobs_service = require('./services/jobs')(context, cluster_service);

    // REST API Endpoints
    var api_service = require('./services/api')(context, app, cluster_service, jobs_service)
};
