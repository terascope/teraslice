'use strict';

var _ = require('lodash');

module.exports = function(context) {
    var context = context;
    var logger = context.logger;

    return function(num, envOptions) {
        var cluster = context.cluster;
        //default assignment is set to worker
        //service_context acts as a dictionary to know what env variables are needed on restarts and crashes
        var env = {
            assignment: 'worker',
            service_context: JSON.stringify({assignment: 'worker'})
        };

        if (envOptions) {
            _.assign(env, envOptions);
            env.service_context = JSON.stringify(envOptions);
        }

        if (cluster.isMaster) {
            logger.info('Starting ' + num + ' ' + env.assignment);
            for (var i = 0; i < num; i++) {
                var worker = cluster.fork(env);
                //for cluster master reference, when a worker dies, you don't have access to its env at master level
                _.assign(worker, env)
            }
        }

    }

};