'use strict';

var _ = require('lodash');

module.exports = function(context) {
    var context = context;
    var logger = context.logger;

    return function(num, descriptor, options) {
        var cluster = context.cluster;
        var env = {};
        var type = descriptor ? descriptor : 'worker';
        var id = null;
        var job = null;

        env[type] = true;

        if (options) {
            _.assign(env, options);

            if(env.job){
                job = env.job;
                id = JSON.parse(env.job).__id;
                env.job_id = id
            }
        }

        if (cluster.isMaster) {
            logger.info('Starting ' + num + ' ' + type);
            for (var i = 0; i < num; i++) {
                var worker = cluster.fork(env);

                //for cluster master reference, when a worker dies, you don't have access to its env at master level
                worker.assignment = type;
                worker.job = job;
                worker.job_id = id;
            }
        }

    }

};