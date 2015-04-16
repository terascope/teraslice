'use strict';

var domain = require('domain');
var primary = domain.create();
var logger = require('./lib/logging').logger;

function errorHandler(err) {
    logger.error("Worker crashed");
    if (err.message) {
        logger.error(err.message);    
    }
    
    if (err.stack) {
        logger.error(err.stack);    
    }
    
    process.exit(-1);    
}

// Domain emits 'error' when it's given an unhandled error
primary.on('error', errorHandler);
process.on('uncaughtException', errorHandler);

primary.run(function() {   
    var sysconfig = require('./lib/sysconfig');

    /*
     * Service configuration context
     */
    var context = {};
    context.logger = logger;
    context.sysconfig = sysconfig;
    context.cluster = require('cluster');

    var api = {
        init: function(config) {
            // The master shouldn't need these connections.
            if (! context.cluster.isMaster) {
                loadModule('elasticsearch', config, context);
                loadModule('mongodb', config, context);
                loadModule('statsd', config, context);
                loadModule('redis', config, context);

                // We have to load this here so it uses the same mongoose instance
                // This is not really where this belongs.
                if (config.baucis) {
                    logger.info("Loading module Baucis");
                    context.baucis = require('baucis');    
                }        

                if (config.worker && typeof config.worker === 'function') {
                    context.worker = config.worker;
                }
                else {
                    logger.info("No worker function provided. Loading default.")
                    context.worker = require('./lib/worker');            
                }
            }
        },

        run: function() {                     
            /**
             * Use cluster to start multiple workers 
             */
            if (context.cluster.isMaster) {
                require('./lib/master')(context);
            }
            else {
                context.worker(context);    
            }    
        }
    }

    module.exports = api;

    function loadModule(module, config, context) {
        var logger = context.logger;
        var sysconfig = context.sysconfig;

        if (config.hasOwnProperty(module)) {
            logger.info("Loading module " + module)

            config[module].forEach(function(env) {
                var moduleConfig;
                if (sysconfig.hasOwnProperty(module)) {
                    moduleConfig = sysconfig[module][env];
                }

                if (! context.hasOwnProperty(module)) {
                    context[module] = {}
                }

                context[module][env] = require('./lib/connectors/' + module)(moduleConfig, logger);
            })
        }
    }
});