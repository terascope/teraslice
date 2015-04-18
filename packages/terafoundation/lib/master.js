var _ = require('lodash');

module.exports = function(context) {
    var cluster = context.cluster;
    var logger = context.logger;

    var plugin = context.master_plugin;

    if (plugin) plugin.pre();

    var shuttingdown = false;

    var workerCount = require('os').cpus().length;

    var shutdown = function() {
        logger.info("Shutting down.");
        shuttingdown = true;

        logger.info("Notifying workers to stop.")        
        logger.info("Waiting for " + _.keys(cluster.workers).length + " workers to stop.")        
        for (var id in cluster.workers) {              
            cluster.workers[id].send({ cmd: "stop" });                                      
        }
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    logger.info("Starting " + workerCount + " workers.")
    for (var i = 0; i < workerCount; i++) {
        cluster.fork();   
    }

    cluster.on('exit', function(worker, code, signal) {
        if (! shuttingdown) {
            logger.info("Worker died " + worker.id + ": launching a new one")

            cluster.fork();
        }
        
        // If we're shuttingdown and all the workers have exited then the master can exit.
        if (shuttingdown && _.keys(cluster.workers).length == 0) {
            logger.info("All workers have exited. Ending.")
            process.exit();
        }            
    })

    if (plugin) plugin.post();

    // Put a friendly message on the terminal of the server.
    logger.info("Service starting");
}
    