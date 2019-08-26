import { get } from '@terascope/utils';
import { Context, ExecutionConfig } from './interfaces';

export function makeContextLogger(context: Context, moduleName: string, extra = {}) {
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

export function makeExContextLogger(context: Context, config: ExecutionConfig, moduleName: string, extra = {}) {
    const { ex_id, job_id } = config;
    return makeContextLogger(context, moduleName, { ex_id, job_id, ...extra });
}
