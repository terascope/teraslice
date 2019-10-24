import * as ts from '@terascope/utils';
import registerApis from './api';
import * as i from './interfaces';


/**
 * CoreContext
*/
export class CoreContext<
    S = {},
    A = {},
    D extends string = string,
> implements i.FoundationContext<S, A, D> {
    readonly cluster: i.Cluster;
    readonly sysconfig: i.FoundationSysConfig<S>;
    readonly apis!: i.ContextAPIs & A;
    readonly foundation!: i.LegacyFoundationApis;
    readonly logger!: ts.Logger;
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
        this.sysconfig = sysconfig;
        this.cluster = cluster;
        this.name = config.name || 'terafoundation';
        this.assignment = assignment || (
            process.env.NODE_TYPE
            || process.env.assignment
            || process.env.ASSIGNMENT
            || 'unknown'
        ) as D;

        if (ts.isFunction(config.cluster_name)) {
            this.cluster_name = config.cluster_name(this.sysconfig);
        }
        if (ts.isString(config.cluster_name)) {
            this.cluster_name = config.cluster_name;
        }
        registerApis(this);
    }
}

export function handleStdStreams() {
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
