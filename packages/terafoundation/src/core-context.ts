import * as ts from '@terascope/utils';
import validateConfigs from './validate-configs';
import registerApis from './api';
import * as i from './interfaces';

/**
 * CoreContext
*/
export class CoreContext<
    S = {},
    A = {},
    D extends string = string
> implements i.FoundationContext<S, A, D> {
    readonly cluster: i.WorkerCluster|i.MasterCluster;
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
        cluster: i.WorkerCluster|i.MasterCluster,
        sysconfig: i.FoundationSysConfig<S>,
        assignment: D
    ) {
        if (!ts.isPlainObject(config) || ts.isEmpty(config)) {
            throw new Error('Terafoundation Context requires a valid application configuration');
        }

        this.sysconfig = validateConfigs(cluster, config, sysconfig);
        this.cluster = cluster;
        this.name = config.name;
        this.assignment = assignment;
        if (typeof config.cluster_name === 'function') {
            this.cluster_name = config.cluster_name(this.sysconfig);
        }
        registerApis(this);
    }
}
