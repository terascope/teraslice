import { Context, WorkerContext } from '../interfaces';
import { SlicerExecutionContext } from './slicer';
import { WorkerExecutionContext } from './worker';
import { ExecutionContextConfig } from './interfaces';

export * from './api';
export * from './interfaces';
export * from './slicer';
export * from './worker';
export * from './utils';

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

export type ExecutionContext = WorkerExecutionContext|SlicerExecutionContext;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function makeExecutionContext(
    config: ExecutionContextConfig
): Promise<ExecutionContext> {
    if (isSlicerContext(config.context)) {
        return SlicerExecutionContext.createContext(config);
    }

    if (isWorkerContext(config.context)) {
        return WorkerExecutionContext.createContext(config);
    }

    throw new Error('ExecutionContext requires an assignment of "execution_controller" or "worker"');
}
