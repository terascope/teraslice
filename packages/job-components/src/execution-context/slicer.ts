import { cloneDeep } from '@terascope/utils';
import {
    SlicerOperationLifeCycle,
    ExecutionStats,
    Slice,
    SliceResult,
    SlicerRecoveryData
} from '../interfaces';
import SlicerCore from '../operations/core/slicer-core';
import { ExecutionContextConfig, JobAPIInstances } from './interfaces';
import BaseExecutionContext from './base';

/**
 * SlicerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class SlicerExecutionContext
    extends BaseExecutionContext<SlicerOperationLifeCycle>
    implements SlicerOperationLifeCycle {
    // ...
    private readonly _slicer: SlicerCore;

    constructor(config: ExecutionContextConfig) {
        super(config, 'slicer_context');

        this._methodRegistry.set('onSliceComplete', new Set());
        this._methodRegistry.set('onSliceDispatch', new Set());
        this._methodRegistry.set('onSliceEnqueued', new Set());
        this._methodRegistry.set('onExecutionStats', new Set());

        // then register the apis specified in config.apis
        for (const apiConfig of this.config.apis || []) {
            const name = apiConfig._name;
            const apiMod = this._loader.loadAPI(name, this.assetIds);

            this.api.addToRegistry(name, apiMod.API);
        }

        const readerConfig = this.config.operations[0];
        const mod = this._loader.loadReader(readerConfig._op, this.assetIds);

        if (mod.API) {
            this.api.addToRegistry(readerConfig._op, mod.API);
        }

        const op = new mod.Slicer(this.context, cloneDeep(readerConfig), this.config);
        this._slicer = op;
        this.addOperation(op);

        this._resetMethodRegistry();
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
