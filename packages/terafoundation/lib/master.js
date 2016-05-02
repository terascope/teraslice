var _ = require('lodash');

module.exports = function(context, config) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configWorkers = context.sysconfig.terafoundation.workers;
    var start_workers = true;

    if (config.start_workers === false) {
        start_workers = false;
    }
    var plugin = context.master_plugin;

    if (plugin) plugin.pre();

    var shuttingDown = false;

    var workerCount = configWorkers ? configWorkers : require('os').cpus().length;

    var shutdown = function() {
        logger.info("Shutting down.");
        shuttingDown = true;

        logger.info("Notifying workers to stop.");
        logger.info("Waiting for " + _.keys(cluster.workers).length + " workers to stop.");
        for (var id in cluster.workers) {
            if (config.shutdownMessaging) {
                cluster.workers[id].send({message: 'shutdown'});
            }
            else {
                cluster.workers[id].kill('SIGINT');
            }
        }

        setInterval(function() {
            if (shuttingDown && _.keys(cluster.workers).length === 0) {
                logger.info("All workers have exited. Ending.");
                //sending kill signal allows for master process above to exit as it pleases
                if (config.emitter) {
                    config.emitter.emit('shutdown')
                }
                else {
                    process.exit();
                }
            }
            else if (shuttingDown) {
                logger.info("Waiting for workers to stop: " + _.keys(cluster.workers).length + " pending.");
            }
        }, 1000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    //default starting workers will use context.worker for code source;
    if (start_workers) {
        logger.info("Starting " + workerCount + " workers.");
        for (var i = 0; i < workerCount; i++) {
            cluster.fork();
        }
    }

//assignment is set at /lib/api/start_workers
    function determineWorkerENV(config, worker) {
        var options = {};

        if (worker.service_context) {
            var envConfig = JSON.parse(worker.service_context);
            _.assign(options, envConfig);
            options.service_context = worker.service_context;
        }

        return options;
    }

    function shouldProcessRestart(code, signal) {
        var signalOptions = {'SIGKILL': true, 'SIGTERM': true, 'SIGINT': true};
        var bool = true;

        //code === 0  means it was a clean exit
        if (code === 0) {
            bool = false;
        }

        if (signalOptions[signal]) {
            bool = false;
        }

        return bool;
    }

    cluster.on('exit', function(worker, code, signal) {
        logger.info("Worker has exited id: " + worker.id + " code: " + code + " signal: " + signal);
        if (!shuttingDown && shouldProcessRestart(code, signal)) {
            var envConfig = determineWorkerENV(config, worker);
            var newWorker = cluster.fork(envConfig);
            logger.info("launching a new worker, id:", newWorker.id);

            _.assign(cluster.workers[newWorker.id], envConfig)

        }
    });

    if (plugin) plugin.post();

    // Put a friendly message on the terminal of the server.
    logger.info("Service starting");
};
