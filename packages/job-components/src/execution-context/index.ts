import { Context, WorkerContext } from '../interfaces/index.js';
import { SlicerExecutionContext } from './slicer.js';
import { WorkerExecutionContext } from './worker.js';
import { ExecutionContextConfig } from './interfaces.js';

export * from './api.js';
export * from './interfaces.js';
export * from './slicer.js';
export * from './worker.js';
export * from './utils.js';

export function isWorkerContext(context: Context): context is WorkerContext {
    return context.assignment === 'worker';
}

export function isSlicerContext(context: Context): context is WorkerContext {
    return context.assignment === 'execution_controller';
}

export function isWorkerExecutionContext(context: unknown): context is WorkerExecutionContext {
    return context instanceof WorkerExecutionContext;
}

export function isSlicerExecutionContext(context: unknown): context is SlicerExecutionContext {
    return context instanceof SlicerExecutionContext;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeExecutionContext(config: ExecutionContextConfig) {
    if (isSlicerContext(config.context)) {
        return new SlicerExecutionContext(config);
    }

    if (isWorkerContext(config.context)) {
        return new WorkerExecutionContext(config);
    }

    throw new Error('ExecutionContext requires an assignment of "execution_controller" or "worker"');
}
