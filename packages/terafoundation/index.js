'use strict';

module.exports = function (config) {
    var domain = require('domain');
    var primary = domain.create();
    var cluster = require('cluster');
    var _ = require('lodash');

    var argv = require('yargs')
        .alias('c', 'configfile')
        .alias('b', 'bootstrap').argv;

    var sysconfig = require('./lib/sysconfig')({
        configfile: argv.configfile
    });

    var logger = require('./lib/logging')({
        name: config.name,
        cluster: cluster,
        sysconfig: sysconfig
    });

    function errorHandler(err) {
        logger.error("Worker crashed");
        if (err.message) {
            logger.error(err.message);
        }

        if (err.stack) {
            logger.error(err.stack);
        }
        //log saving to disk is async, using hack to give time to flush
        setTimeout(function () {
            process.exit(-1);
        }, 600)
    }

    // Domain emits 'error' when it's given an unhandled error
    primary.on('error', errorHandler);
    process.on('uncaughtException', errorHandler);

    primary.run(function () {

        /*
         * Service configuration context
         */
        var context = {};
        context.logger = logger;
        //context.configfile = argv.configfile;
        context.sysconfig = sysconfig;
        if (!context.sysconfig) {
            throw "No system configuration. Can not continue."
        }

        context.cluster = cluster;

        // TODO: this can be made more dynamic so we don't hardcode here.
        loadModule('elasticsearch', context);
        loadModule('mongodb', context);
        loadModule('statsd', context);
        loadModule('redis', context);
        loadModule('kafka', context);

        // The master shouldn't need these connections.
        if (!context.cluster.isMaster) {
            // We have to load this here so it uses the same mongoose instance
            // This is really a TeraServer dependency and doesn't belong here.
            // It's a problem when TeraServer is loaded from node_modules.
            if (config.baucis) {
                logger.info("Loading module Baucis");
                context.baucis = require('baucis');
            }

            if (config.worker && typeof config.worker === 'function') {
                context.worker = config.worker;
            }
            else {
                logger.info("No worker function provided. Loading default.");
                context.worker = require('./lib/worker');
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
                        config.bootstrap(context, function () {
                            //process.exit(0);
                        });
                    }
                    else {
                        logger.error("No bootstrap function provided. Nothing to do.");
                        //process.exit(0);
                    }
                }

                require('./lib/master')(context);

                // If there's a master plugin defined, pass it on.
                if (config.master) {
                    //TODO reexamine this code here
                    context.master_plugin = config.master(context);
                }
            }
            else {
                context.worker(context);
            }
        }

        function loadModule(module, context) {
            var logger = context.logger;
            var sysconfig = context.sysconfig;

            if (sysconfig.hasOwnProperty(module)) {
                logger.info("Loading module " + module);

                // Load each connection defined for the module
                _.forOwn(sysconfig[module], function(moduleConfig, conn) {
                    if (! context.hasOwnProperty(module)) {
                        context[module] = {}
                    }
                    
                    context[module][conn] = require('./lib/connectors/' + module)(moduleConfig, logger);            
                })
            }
        }
    });

    return primary;
};
