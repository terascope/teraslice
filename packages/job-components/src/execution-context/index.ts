export * from './api';
export * from './interfaces';
export * from './slicer';
export * from './worker';

import { Context, Assignment } from '../interfaces';
import { SlicerExecutionContext } from './slicer';
import { WorkerExecutionContext } from './worker';
import {
    ExecutionContextConfig,
    WorkerContext,
    SlicerContext
} from './interfaces';

export function isWorkerContext(context: Context): context is WorkerContext {
    return context.assignment === Assignment.Worker;
}

export function isSlicerContext(context: Context): context is SlicerContext {
    return context.assignment === Assignment.ExecutionController;
}

export function isWorkerExecutionContext(context: WorkerExecutionContext|SlicerExecutionContext): context is WorkerExecutionContext  {
    return context.context.assignment === Assignment.Worker;
}

export function isSlicerExecutionContext(context: WorkerExecutionContext|SlicerExecutionContext): context is SlicerExecutionContext  {
    return context.context.assignment === Assignment.ExecutionController;
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
