'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const express = require('express');
const request = require('request');
const { ClusterMaster } = require('@terascope/teraslice-messaging');
const ExecutionService = require('./services/execution');
const APIService = require('./services/api');
const JobService = require('./services/jobs');
const shutdownHandler = require('./shutdown-handler');
const makeLogs = require('./storage/logs');

module.exports = function _clusterMaster(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'cluster_master' });
    const clusterConfig = context.sysconfig.teraslice;
    const assetsPort = process.env.assets_port;
    const assetsUrl = `http://127.0.0.1:${assetsPort}`;

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

    shutdownHandler(context, logger, shutdown);

    function shutdown() {
        logger.info('cluster_master is shutting down');
        const services = _.values(context.services);
        return Promise.map(services, service => service.shutdown())
            .then(() => clusterMasterServer.shutdown())
            .then(() => logger.flush())
            .catch((err) => {
                logger.error('Error while cluster_master shutting down, error:', err);
            });
    }

    function isAssetServiceUp() {
        return new Promise((resolve) => {
            request.get(assetsUrl, { timeout: 900 }, (err, response) => {
                if (err || response.statusCode >= 500) {
                    resolve(false);
                } else {
                    resolve(true);
                }
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

    Promise.resolve()
        .then(() => clusterMasterServer.start())
        .then(() => {
            logger.info(`ClusterMaster listening on port ${clusterConfig.port}`);
            return ExecutionService(context, { clusterMasterServer });
        })
        .then((executionService) => {
            logger.trace('ExecutionService has been instantiated');
            context.services.execution = executionService;
            return JobService(context);
        })
        .then((jobsService) => {
            logger.trace('JobService has been instantiated');
            context.services.jobs = jobsService;
            // give the assets service 5 minutes to come up
            return waitForAssetsService(Date.now() + 5 * 60 * 1000);
        })
        .then(() => APIService(context, app, { assetsUrl, clusterMasterServer }))
        .then((apiService) => {
            logger.trace('APIService has been instantiated');
            context.services.api = apiService;
            return makeLogs(context);
        })
        .then(() => logger.info('Ready'))
        .catch((err) => {
            logger.error('error during service initialization', err);
            process.exit(0);
        });
};
