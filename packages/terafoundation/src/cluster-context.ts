import _cluster from 'node:cluster';
import { get, isFunction, getFullErrorStack, isKey } from '@terascope/core-utils';
import type { Terafoundation } from '@terascope/types';
import { getArgs } from './sysconfig.js';
import validateConfigs from './validate-configs.js';
import { CoreContext, handleStdStreams } from './core-context.js';
import master from './master.js';

const cluster: Terafoundation.Cluster = _cluster as any;

// this module is not really testable
/* istanbul ignore next */
/**
 * A Cluster Context (with worker processes), useful for scaling
*/
export class ClusterContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string
> extends CoreContext<S, A, D> {
    constructor(
        config: Terafoundation.Config<S, A, D>,
        sysconfig: Terafoundation.SysConfig<S>
    ) {
        super(config, cluster, sysconfig);
        this._errorHandler = this._errorHandler.bind(this);

        handleStdStreams();
        process.on('uncaughtException', this._errorHandler);
        process.on('unhandledRejection', this._errorHandler);

        if (config.script) {
            /**
             * Run a script only
             */
            config.script(this);
        } else if (this.cluster.isMaster) {
            /**
             * Use cluster to start multiple workers
             */
            master(this, config);
            if (isFunction(config.master)) {
                config.master(this, config);
            }
        } else {
            /**
             * Start a worker process
             */
            let keyFound = false;
            if (config.descriptors) {
                Object.keys(config.descriptors).forEach((key) => {
                    if (this.assignment === key && isKey(config, key)) {
                        keyFound = true;
                        config[key](this);
                    }
                });
                // if no key was explicitly set then default to worker
                if (!keyFound) {
                    config.worker!(this);
                }
            } else {
                config.worker!(this);
            }
        }
    }

    private _errorHandler(err: any) {
        const logErr = this.logger
            ? this.logger.error.bind(this.logger)
            : console.error;

        if (cluster.isMaster) {
            logErr(
                getFullErrorStack(err),
                `Error in master with pid: ${process.pid}`
            );
        } else {
            logErr(
                getFullErrorStack(err),
                `Error in worker: ${get(this.cluster, 'worker.id')} pid: ${process.pid}`
            );
        }

        // log saving to disk is async, using hack to give time to flush
        setTimeout(() => {
            process.exit(-1);
        }, 600);
    }

    static async createContext<
        S = Record<string, any>,
        A = Record<string, any>,
        D extends string = string
    >(
        config: Terafoundation.Config<S, A, D>,
    ) {
        const parsedArgs = await getArgs<S>(
            config.default_config_file
        );

        const sysconfig = await validateConfigs(
            cluster,
            config,
            parsedArgs.configfile
        );

        return new ClusterContext(config, sysconfig);
    }
}
