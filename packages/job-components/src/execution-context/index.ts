import { SlicerExecutionContext } from './slicer.js';
import { WorkerExecutionContext } from './worker.js';
import { ExecutionContextConfig } from './interfaces.js';

export * from './api.js';
export * from './interfaces.js';
export * from './slicer.js';
export * from './worker.js';
export * from './utils.js';

export function isWorkerExecutionContext(context: unknown): context is WorkerExecutionContext {
    return context instanceof WorkerExecutionContext;
}

export function isSlicerExecutionContext(context: unknown): context is SlicerExecutionContext {
    return context instanceof SlicerExecutionContext;
}

export type ExecutionContext = WorkerExecutionContext | SlicerExecutionContext;

export async function makeExecutionContext(
    config: ExecutionContextConfig
): Promise<ExecutionContext> {
    if (config.context.assignment === 'execution_controller') {
        return SlicerExecutionContext.createContext(config);
    }

    if (config.context.assignment === 'worker') {
        return WorkerExecutionContext.createContext(config);
    }

    throw new Error('ExecutionContext requires an assignment of "execution_controller" or "worker"');
}
