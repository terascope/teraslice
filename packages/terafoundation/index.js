'use strict';

module.exports = function module(config) {
    const domain = require('domain');
    const primary = domain.create();
    const cluster = require('cluster');
    const _ = require('lodash');

    const validateConfigs = require('./lib/validate_configs');
    const { loggerClient } = require('./lib/logger_utils');
    const api = require('./lib/api');

    const name = config.name ? config.name : 'terafoundation';

    const { argv } = require('yargs')
        .usage('Usage: $0 [options]')
        .alias('c', 'configfile')
        .describe('c', `Configuration file to load.
            If not specified, the envorinment TERAFOUNDATION_CONFIG can be used.`)
        .alias('b', 'bootstrap')
        .describe('b', 'Perform initial setup')
        .help('h')
        .alias('h', 'help');

    const configFile = require('./lib/sysconfig')({
        configfile: argv.configfile
    });

    // allows top level function to declare ops_directory, so not hard baked in
    // TODO verify why we need this
    if (typeof config.ops_directory === 'function') {
        config.ops_directory = config.ops_directory(configFile);
    }

    let logger;

    const sysconfig = validateConfigs(cluster, config, configFile);

    // set by initAPI

    function errorHandler(err) {
        // eslint-disable-next-line no-console
        const logErr = logger ? logger.error.bind(logger) : console.log;
        if (cluster.isMaster) {
            logErr(`Error in master with pid: ${process.pid}`);
        } else {
            logErr(`Error in worker: ${cluster.worker.id} pid: ${process.pid}`);
        }

        if (err.message) {
            logErr(err.message);
        } else {
            logErr(err);
        }

        if (err.stack) {
            logErr(err.stack);
        }

        // log saving to disk is async, using hack to give time to flush
        setTimeout(() => {
            process.exit(-1);
        }, 600);
    }

    function findWorkerCode(context) {
        let keyFound = false;
        if (config.descriptors) {
            _.forOwn(config.descriptors, (value, key) => {
                if (process.env.assignment === key) {
                    keyFound = true;
                    config[key](context);
                }
            });
            // if no key was explicitly set then default to worker
            if (!keyFound) {
                config.worker(context);
            }
        } else {
            config.worker(context);
        }
    }

    // Domain emits 'error' when it's given an unhandled error
    primary.on('error', errorHandler);
    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', errorHandler);

    primary.run(() => {
        /*
         * Service configuration context
         */
        const context = {};

        context.sysconfig = sysconfig;
        context.cluster = cluster;
        context.name = name;
        context.arch = process.arch;
        context.platform = process.platform;

        if (typeof config.cluster_name === 'function') {
            context.cluster_name = config.cluster_name(context.sysconfig);
        }

        // Initialize the API
        api(context);

        // Bootstrap the top level logger
        logger = context.apis.foundation.makeLogger(context.name, context.name);
        context.logger = logger;

        // FIXME: this should probably be refactored to actually create the
        // logger as it stands this function is very confusing
        loggerClient(context);

        if (config.script) {
            config.script(context);
        /**
         * Use cluster to start multiple workers
         */
        } else if (context.cluster.isMaster) {
            /**
             * If the bootstrap option is provided we run the bootstrap function to
             * do any initial application setup.
             * */
            // TODO verify we need this
            if (argv.bootstrap) {
                if (config.bootstrap && typeof config.bootstrap === 'function') {
                    config.bootstrap(context, () => {
                        // process.exit(0);
                    });
                } else {
                    logger.error('No bootstrap function provided. Nothing to do.');
                    // process.exit(0);
                }
            }

            require('./lib/master')(context, config);

            // If there's a master plugin defined, pass it on.
            if (config.master) {
                // TODO reexamine this code here
                context.master_plugin = config.master(context, config);
            }
        } else {
            findWorkerCode(context);
        }
    });

    return primary;
};
