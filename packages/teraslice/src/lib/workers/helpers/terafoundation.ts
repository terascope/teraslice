import {
    Logger, get, isFunction,
    isString
} from '@terascope/core-utils';
import { makeContextLogger, Context } from '@terascope/job-components';
import { safeDecode } from '../../utils/encoding_utils.js';

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

    const defaultContext: Record<string, any> = {};
    if (process.env.EX) {
        const ex = safeDecode(process.env.EX);
        const exId = get(ex, 'ex_id');
        const jobId = get(ex, 'job_id');
        if (exId) {
            defaultContext.ex_id = exId;
        }
        if (jobId) {
            defaultContext.job_id = jobId;
        }
    }

    return makeContextLogger(context, moduleName, Object.assign(defaultContext, extra));
}
