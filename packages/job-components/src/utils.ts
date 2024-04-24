import { get, Logger } from '@terascope/utils';
import { Context, ExecutionConfig } from './interfaces/index';

export function makeContextLogger(context: Context, moduleName: string, extra = {}): Logger {
    return context.apis.foundation.makeLogger(
        Object.assign(
            {
                module: moduleName,
                worker_id: get(context, 'cluster.worker.id'),
                assignment: get(context, 'assignment'),
            },
            extra
        )
    );
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
