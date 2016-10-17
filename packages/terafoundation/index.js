'use strict';

module.exports = function(config) {
    var domain = require('domain');
    var primary = domain.create();
    var cluster = require('cluster');
    var _ = require('lodash');
    var convict = require('convict');
    var validateConfigs = require('./lib/validate_configs');
    var name = config.name ? config.name : 'terafoundation';
    var loggerClient = require('./lib/logger_utils').loggerClient;
    var logging_connection = 'default';

    var argv = require('yargs')
        .alias('c', 'configfile')
        .alias('b', 'bootstrap').argv;

    var configFile = require('./lib/sysconfig')({
        configfile: argv.configfile
    });

    //allows top level function to declare ops_directory, so not hard baked in
    if (typeof config.ops_directory === 'function') {
        config.ops_directory = config.ops_directory(configFile);
    }

    var logger;

    var sysconfig = validateConfigs(cluster, config, configFile);
    //set by initAPI

    function errorHandler(err) {
        var logErr = logger ? logger.error.bind(logger) : console.log;
        if (cluster.isMaster) {
            logErr("Error in master with pid: " + process.pid);
        }
        else logErr("Error in worker: " + cluster.worker.id + " pid: " + process.pid);

        if (err.message) {
            logErr(err.message);
        }
        else {
            logErr(err);
        }

        if (err.stack) {
            logErr(err.stack);
        }

        //log saving to disk is async, using hack to give time to flush
        setTimeout(function() {
            process.exit(-1);
        }, 600)
    }

    function initAPI(context) {
        var makeLogger = require('./lib/api/make_logger')(context);
        //set outside logger
        logger = makeLogger(name, name);
        context.logger = logger;
        var getConnection = require('./lib/api/get_connection')(context);
        context.foundation = {
            makeLogger: makeLogger,
            startWorkers: require('./lib/api/start_workers')(context),
            getConnection: getConnection
        };

        loggerClient(context, logger, logging_connection)
    }

    function findWorkerCode(context, config) {
        var keyFound = false;
        if (config.descriptors) {
            _.forOwn(config.descriptors, function(value, key) {
                if (process.env.assignment === key) {
                    keyFound = true;
                    config[key](context);
                }
            });
            //if no key was explicitly set then default to worker
            if (!keyFound) {
                config.worker(context);
            }
        }
        else {
            config.worker(context);
        }
    }

    // Domain emits 'error' when it's given an unhandled error
    primary.on('error', errorHandler);
    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', errorHandler);

    primary.run(function() {

        /*
         * Service configuration context
         */
        var context = {};

        context.sysconfig = sysconfig;
        context.cluster = cluster;
        context.name = name;

        if (typeof config.cluster_name === 'function') {
            context.cluster_name = config.cluster_name(context.sysconfig);
        }

        if (typeof config.logging_connection === 'function') {
            logging_connection = config.logging_connection(context.sysconfig)
        }

        initAPI(context);

        // The master shouldn't need these connections.
        if (!context.cluster.isMaster) {
            // We have to load this here so it uses the same mongoose instance
            // This is really a teraserver dependency and doesn't belong here.
            // It's a problem when teraserver is loaded from node_modules.
            if (config.baucis) {
                logger.info("Loading module Baucis");
                context.baucis = require('baucis');
            }

        }

        if (config.script) {
            config.script(context);
        }
        else {
            /**
             * Use cluster to start multiple workers
             */
            if (context.cluster.isMaster) {
                /**
                 * If the bootstrap option is provided we run the bootstrap function to
                 * do any initial application setup.
                 **/
                if (argv.bootstrap) {
                    if (config.bootstrap && typeof config.bootstrap === 'function') {
                        config.bootstrap(context, function() {
                            //process.exit(0);
                        });
                    }
                    else {
                        logger.error("No bootstrap function provided. Nothing to do.");
                        //process.exit(0);
                    }
                }

                require('./lib/master')(context, config);

                // If there's a master plugin defined, pass it on.
                if (config.master) {
                    //TODO reexamine this code here
                    context.master_plugin = config.master(context, config);
                }
            }
            else {
                findWorkerCode(context, config)
            }
        }


    });

    return primary;
};
