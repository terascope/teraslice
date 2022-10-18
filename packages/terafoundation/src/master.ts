import { cpus } from 'os';
import { times, once } from '@terascope/utils';
import * as i from './interfaces.js';

export default function masterModule<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
>(
    context: i.FoundationContext<S, A, D>,
    config: i.FoundationConfig<S, A, D>
): void {
    const { logger } = context;
    const cluster = context.cluster as i.Cluster;
    const configWorkers = context.sysconfig.terafoundation.workers;
    let startWorkers = true;
    const events = context.foundation.getEventEmitter();

    if (config.start_workers === false) {
        startWorkers = false;
    }

    let shuttingDown = false;

    const workerCount = configWorkers || cpus().length;

    function shutdown() {
        logger.info('Shutting down.');
        shuttingDown = true;

        const ids = Object.keys(cluster.workers);

        logger.info('Notifying workers to stop.');
        logger.info(`Waiting for ${ids.length} workers to stop.`);
        const workers = ids.map((id) => cluster.workers[id]).filter((v) => v);

        let workersAlive = 0;
        let funcRun = 0;
        let shutdownInterval: NodeJS.Timer;

        const emitShutdown = once(() => {
            // optional hook for shutdown sequences
            events.emit('terafoundation:shutdown');
        });

        function shutdownWorkers() {
            workersAlive = 0;
            funcRun += 1;

            emitShutdown();

            workers.forEach((worker) => {
                if (!worker || worker.isDead()) return;
                workersAlive += 1;

                // On the first execution of the function,
                // send the received signal to all the workers
                if (funcRun > 1) return;

                // use process.isConnected() to ensure the process will receive the IPC message
                if (config.shutdownMessaging && worker.isConnected()) {
                    worker.send({ message: 'shutdown' });
                } else {
                    worker.kill();
                }
            });

            logger.info(`Waiting for workers to stop: ${workersAlive} pending.`);
            if (workersAlive === 0) {
                clearInterval(shutdownInterval);
                logAndFinish();
            }
        }

        shutdownInterval = setInterval(shutdownWorkers, 1000);

        function logAndFinish() {
            logger.info('All workers have exited. Ending.');
            logger.flush()
                .then(() => {
                    process.exit();
                });
        }
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // default starting workers will use context.worker for code source;
    if (startWorkers) {
        logger.info(`Starting ${workerCount} workers.`);
        times(workerCount, () => cluster.fork());
    }

    // assignment is set at /lib/api/start_workers
    function determineWorkerENV(worker: i.FoundationWorker) {
        const options: any = {};

        if (worker.service_context) {
            const envConfig = JSON.parse(worker.service_context);
            Object.assign(options, envConfig);
            options.__process_restart = true;
            options.service_context = worker.service_context;
        }

        return options;
    }

    function shouldProcessRestart(code: number, signal?: string) {
        const signalOptions = { SIGKILL: true, SIGTERM: true, SIGINT: true };
        let bool = true;

        // code === 0  means it was a clean exit
        if (code === 0) {
            bool = false;
        }

        if (signal && signalOptions[signal]) {
            bool = false;
        }

        return bool;
    }

    cluster.on('exit', (_worker, code, signal) => {
        const worker = _worker as i.FoundationWorker;
        const type = worker.assignment ? worker.assignment : 'worker';
        logger.info(`${type} has exited, id: ${worker.id}, code: ${code}, signal: ${signal}`);
        if (!shuttingDown && shouldProcessRestart(code, signal)) {
            const envConfig = determineWorkerENV(worker);
            const newWorker = cluster.fork(envConfig);
            logger.info(`launching a new ${type}, id: ${newWorker.id}`);
            logger.debug('new worker configuration:', envConfig);

            Object.assign(cluster.workers[newWorker.id], envConfig);
        }
    });

    // Put a friendly message on the terminal of the server.
    logger.info('Service starting');
}
