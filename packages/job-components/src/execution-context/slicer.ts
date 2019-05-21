import { cloneDeep, debugLogger, Logger } from '@terascope/utils';
import { SlicerOperationLifeCycle, ExecutionStats, Slice, SliceResult } from '../interfaces';
import SlicerCore from '../operations/core/slicer-core';
import { ExecutionContextConfig } from './interfaces';
import BaseExecutionContext from './base';

const _logger = debugLogger('execution-context-slicer');

/**
 * SlicerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class SlicerExecutionContext extends BaseExecutionContext<SlicerOperationLifeCycle> implements SlicerOperationLifeCycle {
    private readonly _slicer: SlicerCore;
    readonly logger: Logger;

    constructor(config: ExecutionContextConfig, logger: Logger = _logger) {
        super(config);
        this.logger = logger;

        this._methodRegistry.set('onSliceComplete', new Set());
        this._methodRegistry.set('onSliceDispatch', new Set());
        this._methodRegistry.set('onSliceEnqueued', new Set());
        this._methodRegistry.set('onExecutionStats', new Set());

        const readerConfig = this.config.operations[0];
        const mod = this._loader.loadReader(readerConfig._op, this.assetIds);

        const op = new mod.Slicer(this.context, cloneDeep(readerConfig), this.config);
        this._slicer = op;
        this.addOperation(op);

        this._resetMethodRegistry();
    }

    /**
     * Called during execution initialization
     * @param recoveryData is the data to recover from
     */
    async initialize(recoveryData?: object[]) {
        return super.initialize(recoveryData);
    }

    /** The instance of a "Slicer" */
    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this._slicer as T;
    }

    onExecutionStats(stats: ExecutionStats) {
        this._runMethod('onExecutionStats', stats);
    }

    onSliceEnqueued(slice: Slice) {
        this._runMethod('onSliceEnqueued', slice);
    }

    onSliceDispatch(slice: Slice) {
        this._runMethod('onSliceDispatch', slice);
    }

    onSliceComplete(result: SliceResult) {
        this._runMethod('onSliceComplete', result);
    }
}
