import {
    Logger, isFunction, isString,
    isNil
} from '@terascope/utils';
import validateConfigs from './validate-configs.js';
import { getArgs } from './sysconfig.js';
import registerApis from './api/index.js';
import {
    FoundationConfig, Cluster, FoundationContext,
    ContextAPIs, FoundationSysConfig, ParsedArgs
} from './interfaces.js';

/**
 * CoreContext
*/
export class CoreContext<
    S = Record<string, any>,
    A = Record<string, any>,
    D extends string = string,
> implements FoundationContext<S, A, D> {
    readonly cluster: Cluster;
    readonly foundationConfig: FoundationConfig<S, A, D>
    readonly sysconfig!: FoundationSysConfig<S>;
    readonly apis!: ContextAPIs & A;
    readonly logger!: Logger;
    readonly name: string;
    readonly arch = process.arch;
    readonly platform = process.platform;
    assignment: D;
    cluster_name?: string;

    constructor(
        config: FoundationConfig<S, A, D>,
        cluster: Cluster,
        assignment?: D
    ) {
        this.cluster = cluster;
        this.foundationConfig = config;
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

        if (isString(config.cluster_name)) {
            this.cluster_name = config.cluster_name;
        }
    }

    async init(overrideArgs?: ParsedArgs<S>) {
        const { cluster, foundationConfig } = this;

        // its only set in TestContext
        let _sysConfig = this.sysconfig;

        if (isNil(_sysConfig)) {
            const parsedArgs = overrideArgs || getArgs<S>(
                foundationConfig.default_config_file
            );

            _sysConfig =  parsedArgs.configfile
        }

        const sysconfig = await validateConfigs(
            cluster,
            foundationConfig,
            _sysConfig
        );
        // @ts-expect-error only error because we set in init instead of constructor
        this.sysconfig = sysconfig;


        if (isFunction(foundationConfig.cluster_name)) {
            this.cluster_name = foundationConfig.cluster_name(this.sysconfig);
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
