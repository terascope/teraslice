import { Logger, isString, isFunction } from '@terascope/utils';
import registerApis from './api/index.js';
import * as i from './interfaces.js';

/**
 * CoreContext
*/
export class CoreContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string,
> implements i.FoundationContext<S, A, D> {
    readonly cluster: i.Cluster;
    readonly sysconfig!: i.FoundationSysConfig<S>;
    readonly apis!: i.ContextAPIs & A;
    readonly foundation!: i.LegacyFoundationApis;
    readonly logger!: Logger;
    readonly name: string;
    readonly arch = process.arch;
    readonly platform = process.platform;
    assignment: D;
    cluster_name?: string;

    constructor(
        config: i.FoundationConfig<S, A, D>,
        cluster: i.Cluster,
        sysconfig: i.FoundationSysConfig<S>,
        assignment?: D
    ) {
        this.cluster = cluster;
        this.name = config.name || 'terafoundation';
        this.assignment = assignment || (
            process.env.NODE_TYPE
            || process.env.assignment
            || process.env.ASSIGNMENT
        ) as D;

        // set the process.title to make it easier to find the process
        if (config.name && this.assignment) {
            const separator = this.assignment.includes('-') ? '-' : '_';
            process.title = `${config.name}${separator}${this.assignment}`;
        } else if (config.name) {
            process.title = config.name;
        }

        if (isFunction(config.cluster_name)) {
            this.cluster_name = config.cluster_name(this.sysconfig);
        }

        if (isString(config.cluster_name)) {
            this.cluster_name = config.cluster_name;
        }

        registerApis(this);
    }
}

export function handleStdStreams(): void {
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
}
