import _cluster from 'cluster';
import { isFunction, getFullErrorStack, get } from '@terascope/utils';
import * as i from './interfaces.js';
import { CoreContext, handleStdStreams } from './core-context.js';
import master from './master.js';

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
        super(config, cluster);
        this._errorHandler = this._errorHandler.bind(this);
        handleStdStreams();
        process.on('uncaughtException', this._errorHandler);
        process.on('unhandledRejection', this._errorHandler);
    }

    async init(): Promise<void> {
        await super.init();
        const { foundationConfig } = this;

        if (foundationConfig.script) {
            /**
             * Run a script only
             */
             foundationConfig.script(this);
        } else if (this.cluster.isMaster) {
            /**
             * Use cluster to start multiple workers
             */
            master(this, foundationConfig);
            if (isFunction(foundationConfig.master)) {
                foundationConfig.master(this, foundationConfig);
            }
        } else {
            /**
             * Start a worker process
             */
            let keyFound = false;
            if (foundationConfig.descriptors) {
                Object.keys(foundationConfig.descriptors).forEach((key) => {
                    if (this.assignment === key) {
                        keyFound = true;
                        foundationConfig[key](this);
                    }
                });
                // if no key was explicitly set then default to worker
                if (!keyFound) {
                    foundationConfig.worker!(this);
                }
            } else {
                foundationConfig.worker!(this);
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
