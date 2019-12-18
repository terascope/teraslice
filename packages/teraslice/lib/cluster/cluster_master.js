'use strict';

const express = require('express');
const request = require('request');
const { pDelay, logError, get } = require('@terascope/utils');
const { ClusterMaster } = require('@terascope/teraslice-messaging');
const { makeLogger } = require('../workers/helpers/terafoundation');
const makeExecutionService = require('./services/execution');
const makeApiService = require('./services/api');
const makeStateService = require('./services/state');
const makeJobService = require('./services/jobs');

module.exports = function _clusterMaster(context) {
    const logger = makeLogger(context, 'cluster_master');
    const clusterConfig = context.sysconfig.teraslice;
    const assetsPort = process.env.assets_port;
    const assetsUrl = `http://127.0.0.1:${assetsPort}`;
    let running = false;

    // Initialize the HTTP service for handling incoming requests.
    const app = express();

    const clusterMasterServer = new ClusterMaster.Server({
        port: clusterConfig.port,
        nodeDisconnectTimeout: clusterConfig.node_disconnect_timeout,
        // setting request timeout to 5 minutes
        serverTimeout: 300000,
        // we do this to override express final response handler
        requestListener(req, res) {
            app(req, res, (err) => {
                if (err) logger.warn(err, 'unexpected server error');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'api is not available' }));
            });
        },
        networkLatencyBuffer: clusterConfig.network_latency_buffer,
        actionTimeout: clusterConfig.action_timeout,
        logger,
    });

    context.services = {};

    function isAssetServiceUp() {
        return new Promise((resolve) => {
            request.get(
                {
                    baseUrl: assetsUrl,
                    uri: '/status',
                    json: true,
                    timeout: 900,
                },
                (err, response) => {
                    resolve(get(response, 'body.available', false));
                }
            );
        });
    }

    function waitForAssetsService(timeoutAt) {
        if (Date.now() > timeoutAt) {
            return Promise.reject(new Error('Timeout waiting for asset service to come online'));
        }
        return isAssetServiceUp().then((isUp) => {
            if (isUp) return Promise.resolve();
            return pDelay(1000).then(() => waitForAssetsService(timeoutAt));
        });
    }

    let apiService;

    return {
        async initialize() {
            try {
                await clusterMasterServer.start();
                logger.info(`cluster master listening on port ${clusterConfig.port}`);

                const [
                    execution,
                    jobs,
                    state,
                ] = await Promise.all([
                    makeExecutionService(context, { clusterMasterServer }),
                    makeJobService(context),
                    makeStateService(context),
                ]);

                logger.debug('services has been instantiated');

                context.services.execution = execution;
                context.services.jobs = jobs;
                context.services.state = state;

                await Promise.all(Object.values(context.services)
                    .map((service) => service.initialize()));
                logger.debug('services has been initialized');

                // give the assets service a bit to come up
                const fiveMinutes = 5 * 60 * 1000;
                await waitForAssetsService(Date.now() + fiveMinutes);

                // this must be last
                apiService = await makeApiService(context, app, {
                    assetsUrl,
                    clusterMasterServer
                });
                logger.info('cluster master is ready!');
                running = true;
            } catch (err) {
                logError(logger, err, 'error during service initialization');
                running = false;
                throw err;
            }
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
        async shutdown() {
            running = false;

            logger.info('cluster_master is shutting down');
            clusterMasterServer.isShuttingDown = true;

            await apiService.shutdown();

            await Promise.all(Object.entries(context.services)
                .map(async ([name, service]) => {
                    try {
                        await service.shutdown();
                    } catch (err) {
                        logError(logger, err, `Failure to shutdown service ${name}`);
                    }
                }));

            await clusterMasterServer.shutdown();
        },
    };
};
