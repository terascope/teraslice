import { get, Logger } from '@terascope/core-utils';
import { Context, ExecutionConfig } from './interfaces/index';

export function makeContextLogger(context: Context, moduleName: string, extra = {}): Logger {
    const meta = Object.assign(
        {
            module: moduleName,
            worker_id: get(context, 'cluster.worker.id'),
            assignment: get(context, 'assignment'),
        },
        extra
    ) as Record<string, any>;

    return context.apis.foundation.makeLogger(meta);
}

export function makeExContextLogger(
    context: Context,
    config: ExecutionConfig,
    moduleName: string,
    extra = {}
): Logger {
    const { ex_id: exId, job_id: jobId } = config;

    return makeContextLogger(context, moduleName, {
        ex_id: exId,
        job_id: jobId,
        ...extra
    });
}

export function isPromAvailable(context: Context) {
    return context.apis.foundation.promMetrics !== undefined
        && context.apis.foundation.promMetrics.verifyAPI();
}
