export * from './api';
export * from './interfaces';
export * from './slicer';
export * from './worker';

import { Context } from '../interfaces';
import { SlicerExecutionContext } from './slicer';
import { WorkerExecutionContext } from './worker';
import {
    ExecutionContextConfig,
    WorkerContext,
    SlicerContext
} from './interfaces';

export function isWorkerContext(context: Context): context is WorkerContext {
    return context.assignment === 'worker';
}

export function isSlicerContext(context: Context): context is SlicerContext {
    return context.assignment === 'execution_controller';
}

export function makeExecutionContext(config: ExecutionContextConfig) {
    if (isSlicerContext(config.context)) {
        return new SlicerExecutionContext(config);
    }

    if (isWorkerContext(config.context)) {
        return new WorkerExecutionContext(config);
    }

    throw new Error('ExecutionContext requires an assignment of "execution_controller" or "worker"');
}
