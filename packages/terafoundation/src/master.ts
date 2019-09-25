import { cpus } from 'os';
import { times, Overwrite } from '@terascope/utils';
import {
    Cluster as NodeJSCluster,
    Worker as NodeJSWorker
} from 'cluster';
import * as i from './interfaces';

type Worker = NodeJSWorker & {
    __process_restart?: boolean;
    service_context: any;
    assignment: string;
};

type MasterCluster = Overwrite<NodeJSCluster, {
    isMaster: true;
    workers: {
        [id: string]: Worker;
    };
}>;

export default function masterModule(context: i.FoundationContext, moduleConfig: any): void {
    const { logger } = context;
    const cluster: MasterCluster = context.cluster as any;
    const configWorkers = context.sysconfig.terafoundation.workers;
    let startWorkers = true;
    const events = context.foundation.getEventEmitter();

    if (moduleConfig.start_workers === false) {
        startWorkers = false;
    }
    const plugin = context.master_plugin;

    if (plugin) plugin.pre();

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

        let emittedShutdown = false;
        const emitShutdown = () => {
            if (emittedShutdown) return;
            emittedShutdown = true;
            // optional hook for shutdown sequences
            events.emit('terafoundation:shutdown');
        };

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
                if (moduleConfig.shutdownMessaging && worker.isConnected()) {
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
    function determineWorkerENV(worker: Worker) {
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
        const worker = _worker as Worker;
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

    if (plugin) plugin.post();

    // Put a friendly message on the terminal of the server.
    logger.info('Service starting');
}
