'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const express = require('express');
const request = require('request');
const { ClusterMaster } = require('@terascope/teraslice-messaging');
const ExecutionService = require('./services/execution');
const APIService = require('./services/api');
const JobService = require('./services/jobs');
const makeLogs = require('./storage/logs');

module.exports = function _clusterMaster(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'cluster_master' });
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
                if (err) logger.warn('unexpected server error', err);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'api is not available' }));
            });
        },
        networkLatencyBuffer: clusterConfig.network_latency_buffer,
        actionTimeout: clusterConfig.action_timeout,
    });

    context.services = {};

    function isAssetServiceUp() {
        return new Promise((resolve) => {
            request.get({
                baseUrl: assetsUrl,
                uri: '/status',
                json: true,
                timeout: 900
            }, (err, response) => {
                resolve(_.get(response, 'body.available', false));
            });
        });
    }

    function waitForAssetsService(timeoutAt) {
        if (Date.now() > timeoutAt) {
            return Promise.reject(new Error('Timeout waiting for asset service to come online'));
        }
        return isAssetServiceUp().then((isUp) => {
            if (isUp) return Promise.resolve();
            return Promise.delay(1000)
                .then(() => waitForAssetsService(timeoutAt));
        });
    }

    return {
        initialize() {
            return Promise.resolve()
                .then(() => clusterMasterServer.start())
                .then(() => {
                    logger.info(`cluster master listening on port ${clusterConfig.port}`);
                    return ExecutionService(context, { clusterMasterServer });
                })
                .then((executionService) => {
                    logger.debug('execution service has been instantiated');
                    context.services.execution = executionService;
                    return JobService(context);
                })
                .then((jobsService) => {
                    logger.debug('job service has been instantiated');
                    context.services.jobs = jobsService;
                    // give the assets service a bit to come up
                    const fiveMinutes = 5 * 60 * 1000;
                    return waitForAssetsService(Date.now() + fiveMinutes);
                })
                .then(() => APIService(context, app, { assetsUrl, clusterMasterServer }))
                .then((apiService) => {
                    logger.debug('api service has been instantiated');
                    context.services.api = apiService;
                    return makeLogs(context);
                })
                .then(() => {
                    logger.info('cluster master is ready!');
                    running = true;
                })
                .catch((err) => {
                    logger.error('error during service initialization', err);
                    running = false;
                    return Promise.reject(err);
                });
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
        shutdown() {
            running = false;
            logger.info('cluster_master is shutting down');
            clusterMasterServer.isShuttingDown = true;
            return Promise.resolve()
                .then(() => {
                    const services = _.values(context.services);
                    return Promise.map(services, service => service.shutdown());
                })
                .then(() => clusterMasterServer.shutdown());
        }
    };
};
