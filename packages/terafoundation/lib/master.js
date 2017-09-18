'use strict';

const _ = require('lodash');

module.exports = function module(context, moduleConfig) {
    const cluster = context.cluster;
    const logger = context.logger;
    const configWorkers = context.sysconfig.terafoundation.workers;
    let startWorkers = true;
    const events = context.foundation.getEventEmitter();

    if (moduleConfig.start_workers === false) {
        startWorkers = false;
    }
    const plugin = context.master_plugin;

    if (plugin) plugin.pre();

    let shuttingDown = false;

    const workerCount = configWorkers || require('os').cpus().length;

    function shutdown() {
        logger.info('Shutting down.');
        shuttingDown = true;
        // optional hook for shutdown sequences
        events.emit('terafoundation:shutdown');

        logger.info('Notifying workers to stop.');
        logger.info(`Waiting for ${_.keys(cluster.workers).length} workers to stop.`);
        _.forOwn(cluster.workers, (value, id) => {
            if (moduleConfig.shutdownMessaging) {
                cluster.workers[id].send({ message: 'shutdown' });
            } else {
                cluster.workers[id].kill('SIGINT');
            }
        });

        setInterval(() => {
            if (shuttingDown && _.keys(cluster.workers).length === 0) {
                logger.info('All workers have exited. Ending.');
                // sending kill signal allows for master process above to exit as it pleases

                logger.flush()
                    .then(() => {
                        process.exit();
                    });
            } else if (shuttingDown) {
                logger.info(`Waiting for workers to stop: ${_.keys(cluster.workers).length} pending.`);
            }
        }, 1000);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // default starting workers will use context.worker for code source;
    if (startWorkers) {
        logger.info(`Starting ${workerCount} workers.`);
        for (let i = 0; i < workerCount; i += 1) {
            cluster.fork();
        }
    }

    // assignment is set at /lib/api/start_workers
    function determineWorkerENV(worker) {
        const options = {};

        if (worker.service_context) {
            const envConfig = JSON.parse(worker.service_context);
            _.assign(options, envConfig);
            options.__process_restart = true;
            options.service_context = worker.service_context;
        }

        return options;
    }

    function shouldProcessRestart(code, signal) {
        const signalOptions = { SIGKILL: true, SIGTERM: true, SIGINT: true };
        let bool = true;

        // code === 0  means it was a clean exit
        if (code === 0) {
            bool = false;
        }

        if (signalOptions[signal]) {
            bool = false;
        }

        return bool;
    }

    cluster.on('exit', (worker, code, signal) => {
        const type = worker.assignment ? worker.assignment : 'worker';
        logger.info(`${type} has exited, id: ${worker.id}, code: ${code}, signal: ${signal}`);
        if (!shuttingDown && shouldProcessRestart(code, signal)) {
            const envConfig = determineWorkerENV(worker);
            const newWorker = cluster.fork(envConfig);
            logger.info(`launching a new ${type}, id: ${newWorker.id}`);
            logger.debug(`new worker configuration: ${JSON.stringify(envConfig)}`);

            _.assign(cluster.workers[newWorker.id], envConfig);
        }
    });

    if (plugin) plugin.post();

    // Put a friendly message on the terminal of the server.
    logger.info('Service starting');
};
