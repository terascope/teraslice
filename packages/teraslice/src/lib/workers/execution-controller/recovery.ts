import {
    pRaceWithTimeout, logError, Queue,
    Logger
} from '@terascope/core-utils';
import type {
    Context, ExecutionContext, RecoveryCleanupType,
    Slice
} from '@terascope/job-components';
import { SliceCompletePayload } from '@terascope/types';
import type { EventEmitter } from 'node:events';
import { makeLogger } from '../helpers/terafoundation.js';
import type { StateStorage } from '../../storage/state.js';

export class RecoveryModule {
    logger: Logger;
    events: EventEmitter;
    readonly slicersToRecover: number;
    recoveryQueue: Queue<Slice>;
    private recoverComplete = true;
    private isShutdown = false;
    private autorecover: boolean;
    private readonly cleanupType: RecoveryCleanupType | undefined;
    private slicerID = 0;
    private retryState = new Map<string, boolean>();
    private recoverExecution: string | undefined;
    private readonly exId: string;
    private stateStore!: StateStorage;
    private readonly timeout: number;

    constructor(context: Context, executionContext: ExecutionContext) {
        const { exId } = executionContext;

        this.events = context.apis.foundation.getSystemEvents();
        this.slicersToRecover = executionContext.config.slicers;
        this.recoveryQueue = new Queue<Slice>();
        this.cleanupType = executionContext.config.recovered_slice_type;
        this.recoverExecution = executionContext.config.recovered_execution;
        this.autorecover = Boolean(executionContext.config.autorecover);
        this.exId = exId;
        this.logger = makeLogger(context, 'execution_recovery');
        this.timeout = context.sysconfig.teraslice.shutdown_timeout;
    }

    initialize(stateStore: StateStorage) {
        this.stateStore = stateStore;
        this.events.on('slice:success', this._sliceComplete.bind(this));
        this.recoverComplete = false;

        // once we have fully recovered, clean up event listeners
        this.events.once('execution:recovery:complete', () => {
            this.events.removeListener('slice:success', this._sliceComplete.bind(this));
        });
    }

    // TODO: this is wrong
    private _sliceComplete(sliceData: SliceCompletePayload) {
        this.retryState.set(sliceData.slice.slice_id, false);
    }

    private _setId(slice: Slice) {
        this.retryState.set(slice.slice_id, true);
    }

    private async _processIncompleteSlices(slicerID: number) {
        const slices = await this.stateStore.recoverSlices(
            this.recoverExecution as string,
            slicerID,
            this.cleanupType as RecoveryCleanupType
        );

        for (const slice of slices) {
            this._setId(slice);
            this.recoveryQueue.enqueue(slice);
        }

        return slices.length;
    }

    private _recoveryBatchCompleted() {
        return [...this.retryState.values()].every((v) => v === false);
    }

    private _retryState() {
        return Object.fromEntries(this.retryState);
    }

    // TODO: refactor to use pwhile
    private async _waitForRecoveryBatchCompletion() {
        return new Promise((resolve) => {
            const checkingBatch = setInterval(() => {
                if (this._recoveryBatchCompleted()) {
                    clearInterval(checkingBatch);
                    this.events.emit('execution:recovery:complete');
                    this.recoverComplete = true;
                    resolve(true);
                    return;
                }

                if (this.isShutdown) {
                    clearInterval(checkingBatch);
                    this.recoverComplete = false;
                    resolve(true);
                }
            }, 100);
        });
    }

    async handle() {
        if (this.recoverComplete) {
            return true;
        }

        const recoveredSlicesCount = await this._processIncompleteSlices(this.slicerID);
        if (recoveredSlicesCount === 0) {
            this.slicerID++;
            // all slicers have been recovered
            if (this.slicerID > this.slicersToRecover) {
                this.logger.warn(`recovered data for execution: ${this.exId} has successfully been enqueued`);
                await this._waitForRecoveryBatchCompletion();
                return true;
            }
        }

        await this._waitForRecoveryBatchCompletion();

        return false;
    }

    getSlice(): Slice | undefined {
        if (this.recoveryQueue.size() > 0) {
            return this.recoveryQueue.dequeue();
        }
        return;
    }

    getSlices(max = 1) {
        const count = max > this.sliceCount() ? this.sliceCount() : max;
        const slices: Slice[] = [];

        for (let i = 0; i < count; i++) {
            const slice = this.recoveryQueue.dequeue();
            if (!slice) return slices;

            slices.push(slice);
        }

        return slices;
    }

    sliceCount() {
        return this.recoveryQueue.size();
    }

    async shutdown() {
        let checkInterval;

        try {
            await pRaceWithTimeout(
                new Promise((resolve) => {
                    checkInterval = setInterval(() => {
                        if (this.recoverComplete) {
                            resolve(true);
                        }
                    }, 100);
                }),
                this.timeout,
                (err) => {
                    logError(this.logger, err);
                }
            );
        } finally {
            this.isShutdown = true;
            clearInterval(checkInterval);
        }
    }

    recoveryComplete() {
        return this.recoverComplete;
    }

    /**
     * Whether or not the execution will continue to process
     * slices after recovering.
     *
     * @returns {boolean}
    */
    exitAfterComplete() {
        if (this.autorecover) return false;
        if (!this.cleanupType) return false;
        return true;
    }
}
