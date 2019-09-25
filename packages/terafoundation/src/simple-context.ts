import ip from 'ip';
import shortid from 'shortid';
import { EventEmitter } from 'events';
import {
    debugLogger,
    toBoolean,
    get,
    isEmpty,
    isPlainObject,
} from '@terascope/utils';
import validateConfigs from './validate-configs';
import { getArgs } from './sysconfig';
import registerApis from './api';
import * as i from './interfaces';

const assignment = process.env.NODE_TYPE || process.env.assignment || 'worker';
const useDebugLogger = toBoolean(process.env.USE_DEBUG_LOGGER);

function makeContext<S = {}, A = {}, D extends string = string>(
    cluster: i.FoundationCluster,
    config: i.FoundationConfig<S, A, D>,
    sysconfig: i.FoundationSysConfig<S>
): i.FoundationContext<S, A, D> {
    const context: i.FoundationContext<S, A, D> = {
        sysconfig: validateConfigs(cluster, config, sysconfig),
        assignment,
        name: config.name,
        arch: process.arch,
        platform: process.platform,
        cluster,
    } as any;

    if (process.env.POD_IP) {
        context.sysconfig._nodeName = process.env.POD_IP;
    } else {
        context.sysconfig._nodeName = generateWorkerId(context);
    }

    if (typeof config.cluster_name === 'function') {
        context.cluster_name = config.cluster_name(context.sysconfig);
    }

    // Initialize the API
    registerApis(context);
    context.apis.foundation.startWorkers = () => {};
    context.foundation.startWorkers = () => {};

    const events = new EventEmitter();
    context.apis.foundation.getSystemEvents = () => events;
    context.foundation.getEventEmitter = () => events;

    if (useDebugLogger) {
        context.apis.foundation.makeLogger = (...args) => debugLogger(context.assignment, ...args);
        context.foundation.makeLogger = context.apis.foundation.makeLogger;
    }

    // Bootstrap the top level logger
    context.logger = context.apis.foundation.makeLogger(assignment, context.name);

    return context;
}

function getSysConfig(name: string, defaultConfigFile?: string) {
    const { configFile } = getArgs(name, defaultConfigFile);
    return configFile;
}

function generateWorkerId<T extends i.FoundationContext>(context: T) {
    const hostname = getHostname(context);
    const workerId = get(context, 'cluster.worker.id');
    return `${hostname}__${workerId}`;
}

function getHostname<T extends i.FoundationContext>(context: T) {
    const hostname = get(context, ['sysconfig', context.name, 'hostname']);
    if (hostname) return hostname;

    return ip.address();
}

export default function simpleContext<S = {}, A = {}, D extends string = string>(
    config: i.FoundationConfig<S, A, D>,
    overrideArg?: { sysconfig: i.FoundationSysConfig<S> }
): i.FoundationContext<S, A, D> {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    const sysconfig = overrideArg && overrideArg.sysconfig
        ? overrideArg.sysconfig
        : getSysConfig(config.name, config.default_config_file);

    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const cluster = {
        worker: {
            id: shortid.generate(),
        }
    };

    return makeContext(cluster, config, sysconfig);
}
