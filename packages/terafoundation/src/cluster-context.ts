import _cluster from 'cluster';
import * as ts from '@terascope/utils';
import { getArgs } from './sysconfig';
import validateConfigs from './validate-configs';
import * as i from './interfaces';
import { CoreContext, handleStdStreams } from './core-context';
import master from './master';

const cluster: i.Cluster = (_cluster as any);

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
    constructor(config: i.FoundationConfig<S, A, D>) {
        const parsedArgs = getArgs<S>(
            config.default_config_file
        );

        const sysconfig = validateConfigs(
            cluster,
            config,
            parsedArgs.configfile
        );

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
            if (ts.isFunction(config.master)) {
                config.master(this, config);
            }
        } else {
            /**
             * Start a worker process
             */
            let keyFound = false;
            if (config.descriptors) {
                Object.keys(config.descriptors).forEach((key) => {
                    if (this.assignment === key) {
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
        // eslint-disable-next-line no-console
        const logErr = this.logger
            ? this.logger.error.bind(this.logger)
            : console.error;

        if (cluster.isMaster) {
            logErr(
                ts.getFullErrorStack(err),
                `Error in master with pid: ${process.pid}`
            );
        } else {
            logErr(
                ts.getFullErrorStack(err),
                `Error in worker: ${ts.get(this.cluster, 'worker.id')} pid: ${process.pid}`
            );
        }

        // log saving to disk is async, using hack to give time to flush
        setTimeout(() => {
            process.exit(-1);
        }, 600);
    }
}
