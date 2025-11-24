import { cloneDeep } from '@terascope/core-utils';
import {
    SlicerOperationLifeCycle, ExecutionStats, Slice,
    SliceResult, SlicerRecoveryData,
} from '../interfaces/index.js';
import SlicerCore from '../operations/core/slicer-core.js';
import { ExecutionContextConfig, JobAPIInstances } from './interfaces.js';
import BaseExecutionContext from './base.js';

/**
 * SlicerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class SlicerExecutionContext
    extends BaseExecutionContext<SlicerOperationLifeCycle>
    implements SlicerOperationLifeCycle {
    // ...
    private readonly _slicer!: SlicerCore;

    constructor(config: ExecutionContextConfig) {
        super(config, 'slicer_context');

        this._methodRegistry.set('onSliceComplete', new Set());
        this._methodRegistry.set('onSliceDispatch', new Set());
        this._methodRegistry.set('onSliceEnqueued', new Set());
        this._methodRegistry.set('onExecutionStats', new Set());
    }

    static async createContext(config: ExecutionContextConfig): Promise<SlicerExecutionContext> {
        const context = new SlicerExecutionContext(config);

        // then register the apis specified in config.apis
        for (const apiConfig of context.config.apis || []) {
            const name = apiConfig._name;
            const apiMod = await context._loader.loadAPI(name, context.assetIds);

            context.api.addToRegistry(name, apiMod.API);
        }

        const readerConfig = context.config.operations[0];
        const mod = await context._loader.loadReader(readerConfig._op, context.assetIds);

        if (mod.API) {
            context.api.addToRegistry(readerConfig._op, mod.API);
        }

        const op = new mod.Slicer(context.context, cloneDeep(readerConfig), context.config);
        // @ts-expect-error
        context._slicer = op;
        context.addOperation(op);

        context._resetMethodRegistry();

        return context;
    }

    /**
     * Called during execution initialization
     * @param recoveryData is the data to recover from
     */
    async initialize(recoveryData?: SlicerRecoveryData[]): Promise<void> {
        return super.initialize(recoveryData);
    }

    get apis(): JobAPIInstances {
        return this.api.apis;
    }

    /** The instance of a "Slicer" */
    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this._slicer as T;
    }

    onExecutionStats(stats: ExecutionStats): void {
        this._runMethod('onExecutionStats', stats);
    }

    onSliceEnqueued(slice: Slice): void {
        this._runMethod('onSliceEnqueued', slice);
    }

    onSliceDispatch(slice: Slice): void {
        this._runMethod('onSliceDispatch', slice);
    }

    onSliceComplete(result: SliceResult): void {
        this._runMethod('onSliceComplete', result);
    }
}
