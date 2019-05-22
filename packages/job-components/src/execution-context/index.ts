export * from './api';
export * from './interfaces';
export * from './slicer';
export * from './worker';

import { Context, WorkerContext } from '../interfaces';
import { SlicerExecutionContext } from './slicer';
import { WorkerExecutionContext } from './worker';
import { ExecutionContextConfig } from './interfaces';

export function isWorkerContext(context: Context): context is WorkerContext {
    return context.assignment === 'worker';
}

export function isSlicerContext(context: Context): context is WorkerContext {
    return context.assignment === 'execution_controller';
}

export function isWorkerExecutionContext(context: any): context is WorkerExecutionContext {
    return context instanceof WorkerExecutionContext;
}

export function isSlicerExecutionContext(context: any): context is SlicerExecutionContext {
    return context instanceof SlicerExecutionContext;
}

export function makeExecutionContext(config: ExecutionContextConfig) {
    const { ex_id, job_id } = config.executionConfig;

    if (isSlicerContext(config.context)) {
        const logger = makeContextLogger(config.context, 'slicer_context', { ex_id, job_id });
        return new SlicerExecutionContext(config, logger);
    }

    if (isWorkerContext(config.context)) {
        const logger = makeContextLogger(config.context, 'worker_context', { ex_id, job_id });
        return new WorkerExecutionContext(config, logger);
    }

    throw new Error('ExecutionContext requires an assignment of "execution_controller" or "worker"');
}

export function makeContextLogger(context: Context, moduleName: string, extra = {}) {
    const { assignment, cluster } = context;

    return context.apis.foundation.makeLogger(
        Object.assign(
            {
                module: moduleName,
                worker_id: cluster.worker.id,
                assignment,
            },
            extra
        )
    );
}
