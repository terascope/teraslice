import { Logger } from '@terascope/utils';
import { getArgs } from './sysconfig';
import validateConfigs from './validate-configs';
import * as i from './interfaces';
import master from './master';
import api from './api';

// this module is not really testable
/* istanbul ignore next */
export default function ClusterContext<S = {}, A = {}, D extends string = string>(
    config: i.FoundationConfig<S, A, D>
): i.FoundationContext<S, A, D> {
    const cluster = require('cluster');

    const name = config.name ? config.name : 'terafoundation';

    const { configFile, bootstrap } = getArgs(config.name, config.default_config_file);

    let logger: Logger;

    const sysconfig = validateConfigs(cluster, config, configFile);

    // set by initAPI

    function errorHandler(err: any) {
        // eslint-disable-next-line no-console
        const logErr = logger ? logger.error.bind(logger) : console.log;
        if (cluster.isMaster) {
            logErr(`Error in master with pid: ${process.pid}`);
        } else {
            logErr(`Error in worker: ${cluster.worker.id} pid: ${process.pid}`);
        }

        if (err.message) {
            logErr(err.message);
        } else {
            logErr(err);
        }

        if (err.stack) {
            logErr(err.stack);
        }

        // log saving to disk is async, using hack to give time to flush
        setTimeout(() => {
            process.exit(-1);
        }, 600);
    }

    function findWorkerCode(context: any) {
        let keyFound = false;
        if (config.descriptors) {
            Object.keys(config.descriptors).forEach((key) => {
                if (process.env.assignment === key) {
                    keyFound = true;
                    config[key](context);
                }
            });
            // if no key was explicitly set then default to worker
            if (!keyFound) {
                config.worker(context);
            }
        } else {
            config.worker(context);
        }
    }

    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', errorHandler);

    // See https://github.com/trentm/node-bunyan/issues/246
    function handleStdError(err: any) {
        if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
        // ignore
        } else {
            throw err;
        }
    }

    process.stdout.on('error', handleStdError);
    process.stderr.on('error', handleStdError);

    let clusterName: string|undefined;
    if (typeof config.cluster_name === 'function') {
        clusterName = config.cluster_name(sysconfig);
    }

    /*
         * Service configuration context
         */
    const context = {
        sysconfig,
        cluster,
        name,
        arch: process.arch,
        platform: process.platform,
        cluster_name: clusterName
    } as i.FoundationContext<S, A, D>;

    // Initialize the API
    api(context);

    // Bootstrap the top level logger
    logger = context.apis.foundation.makeLogger(context.name, context.name);
    context.logger = logger;

    if (config.script) {
        config.script(context);
        /**
         * Use cluster to start multiple workers
         */
    } else if (context.cluster.isMaster) {
        /**
             * If the bootstrap option is provided we run the bootstrap function to
             * do any initial application setup.
             * */
        // TODO verify we need this
        if (bootstrap) {
            if (config.bootstrap && typeof config.bootstrap === 'function') {
                config.bootstrap(context, () => {
                    // process.exit(0);
                });
            } else {
                logger.error('No bootstrap function provided. Nothing to do.');
                // process.exit(0);
            }
        }

        master(context, config);

        // If there's a master plugin defined, pass it on.
        if (config.master) {
            // TODO reexamine this code here
            context.master_plugin = config.master(context, config);
        }
    } else {
        findWorkerCode(context);
    }

    return context;
}
