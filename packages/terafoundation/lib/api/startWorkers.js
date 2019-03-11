'use strict';

const _ = require('lodash');

module.exports = function module(context) {
    return function startWorkers(num, envOptions) {
        const { logger, cluster } = context;
        // default assignment is set to worker
        // service_context acts as a dictionary to know what env variables
        // are needed on restarts and crashes
        const env = {
            assignment: 'worker',
            service_context: JSON.stringify({ assignment: 'worker' })
        };

        if (envOptions) {
            _.assign(env, envOptions);
            env.service_context = JSON.stringify(envOptions);
        }

        const workers = [];
        if (cluster.isMaster) {
            logger.info(`Starting ${num} ${env.assignment}`);
            for (let i = 0; i < num; i += 1) {
                const worker = cluster.fork(env);

                // for cluster master reference, when a worker dies, you
                // don't have access to its env at master level
                _.assign(worker, env);

                workers.push(worker);
            }
        }

        return workers;
    };
};
