'use strict';

const Promise = require('bluebird');
const makeLogs = require('./storage/logs');
const messageModule = require('./services/messaging');
const _ = require('lodash');
const http = require('http');
const express = require('express');

module.exports = function (context) {
    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: 'cluster_master' });
    const clusterConfig = context.sysconfig.teraslice;
    const parseError = require('@terascope/error-parser');

    // Initialize the HTTP service for handling incoming requests.
    const app = express();
    // we do this to override express final response handler
    const server = http.createServer((req, res) => {
        app(req, res, (err) => {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'api is not available' }));
        });
    }).listen(clusterConfig.port);
    // setting request timeout to 5 minutes
    server.timeout = 300000;
    logger.info(`listening on port ${clusterConfig.port}`);

    const messaging = messageModule(context, logger);
    context.messaging = messaging;
    context.services = {};

    const assetServiceOnline = assetServicelistener();

    // ignore process calls, this is handled by ipc messages from node master
    messaging.register({ event: 'process:SIGTERM', callback: () => {} });
    messaging.register({ event: 'process:SIGINT', callback: () => {} });

    // event is fired from terafoundation when an error occurs during instantiation of a client
    events.on('client:initialization:error', terminalShutdown);

    function terminalShutdown(errEV) {
        logger.error(`Terminal error: ${errEV.error}`);
        messaging.send({ to: 'node_master', message: 'cluster:error:terminal' });
    }

    messaging.register({
        event: 'worker:shutdown',
        callback: () => {
            logger.info('cluster_master is shutting down');
            Promise.all(_.map(context.services, service => service.shutdown()))
                .then(() => logger.flush())
                .then(() => process.exit())
                .catch((err) => {
                    const errMsg = parseError(err);
                    logger.error(`Error while cluster_master shutting down, error: ${errMsg}`);
                    setTimeout(() => {
                        process.exit(0);
                    }, 10);
                });
        }
    });

    function assetServicelistener() {
        let assetsServiceIsReady = false;
        let assetsServiceError = false;

        messaging.register({
            event: 'assets:service:available',
            callback: (assetServiceResponse) => {
                if (assetServiceResponse.error) {
                    assetsServiceError = true;
                } else {
                    assetsServiceIsReady = true;
                }
            }
        });
        return () => new Promise(((resolve, reject) => {
            if (assetsServiceIsReady) {
                resolve(true);
            } else {
                const assetReady = setInterval(() => {
                    if (assetsServiceIsReady) {
                        clearInterval(assetReady);
                        resolve(true);
                    }
                    if (assetsServiceError) {
                        clearInterval(assetReady);
                        reject('An error occurred while instantiating the assets service');
                    }
                }, 100);
            }
        }));
    }
    Promise.resolve()
        .then(() => require('./services/execution.js')(context))
        .then((clusterService) => {
            messaging.listen({ server });
            logger.trace('cluster_service has instantiated');
            context.services.execution = clusterService;
            return require('./services/jobs')(context);
        })
        .then((jobsService) => {
            logger.trace('jobs_service has instantiated');
            context.services.jobs = jobsService;
            return assetServiceOnline();
        })
        .then(() => require('./services/api')(context, app))
        .then((apiService) => {
            logger.trace('api_service has instantiated');
            context.services.api = apiService;
            return makeLogs(context);
        })
        .then(() => logger.info('Ready'))
        .catch((err) => {
            const errMsg = parseError(err);
            logger.error('error during service initialization', errMsg);
            messaging.send({ to: 'node_master', message: 'cluster:error:terminal' });
        });
};
