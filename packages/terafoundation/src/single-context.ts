import shortid from 'shortid';
import {
    isEmpty,
    isPlainObject,
} from '@terascope/utils';
import validateConfigs from './validate-configs';
import { getArgs } from './sysconfig';
import registerApis from './api';
import * as i from './interfaces';

const assignment = process.env.NODE_TYPE || process.env.assignment || 'worker';

/**
 * A Single Process Context
*/
export default function singleContext<S = {}, A = {}, D extends string = string>(
    config: i.FoundationConfig<S, A, D>,
    overrideArg?: { sysconfig: i.FoundationSysConfig<S> }
): i.FoundationContext<S, A, D> {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    const sysconfig = overrideArg && overrideArg.sysconfig
        ? overrideArg.sysconfig
        : getArgs<S>(config.name, config.default_config_file).configfile;

    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const cluster: i.WorkerCluster = {
        isMaster: false,
        isWorker: true,
        worker: {
            id: shortid.generate(),
        }
    };

    const context: i.FoundationContext<S, A, D> = {
        sysconfig: validateConfigs(cluster, config, sysconfig),
        assignment,
        name: config.name,
        arch: process.arch,
        platform: process.platform,
        cluster,
    } as any;

    if (typeof config.cluster_name === 'function') {
        context.cluster_name = config.cluster_name(context.sysconfig);
    }

    // Initialize the API
    registerApis(context);
    context.apis.foundation.makeLogger(assignment, context.name);

    return context;
}
