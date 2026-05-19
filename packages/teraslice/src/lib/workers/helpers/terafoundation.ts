import {
    Logger, get, isFunction,
    isString
} from '@terascope/core-utils';
import { Context } from '@terascope/job-components';

export function generateWorkerId(context: Context) {
    const { hostname } = context.sysconfig.teraslice;
    const clusterId = get(context, 'cluster.worker.id');
    return `${hostname}__${clusterId}`;
}

export function makeLogger(
    context: Context, moduleName: string, extra = {}
): Logger {
    if (!context || !context.apis) {
        throw new Error('makeLogger expected terafoundation context as first arg');
    }

    if (!moduleName || !isString(moduleName)) {
        throw new Error('makeLogger expected module name as second arg');
    }

    const exAPI = context.apis.executionContext;
    if (exAPI && isFunction(exAPI.makeLogger)) {
        return exAPI.makeLogger(moduleName, extra);
    }

    return context.apis.foundation.makeLogger({ module: moduleName, ...extra });
}
