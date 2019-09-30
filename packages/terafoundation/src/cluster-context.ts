import _cluster from 'cluster';
import { get, getFullErrorStack } from '@terascope/utils';
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
    S = {},
    A = {},
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

        handleStdStreams();

        process.on('uncaughtException', (err) => {
            this._errorHandler(err);
        });
        process.on('unhandledRejection', (err) => {
            this._errorHandler(err);
        });

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
            if (config.master) {
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
                    config.worker(this);
                }
            } else {
                config.worker(this);
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
}
