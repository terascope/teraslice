import {
    noop, pDelay, get, toString,
    logError, pWhile, Logger
} from '@terascope/core-utils';
import { makeISODate } from '@terascope/date-utils';
import { Queue } from '@terascope/entity-utils';
import type { EventEmitter } from 'node:events';
import type {
    Context, SlicerExecutionContext, Slice,
    SlicerRecoveryData
} from '@terascope/job-components';
import { RecoveryModule } from './recovery.js';
import { makeLogger } from '../helpers/terafoundation.js';
import type { StateStorage, ExecutionStorage } from '../../storage/index.js';

export class Scheduler {
    readonly context: Context;
    logger: Logger;
    events: EventEmitter;
    readonly executionContext: SlicerExecutionContext;
    readonly exId: string;
    readonly recoverFromExId?: string;
    readonly recoverExecution?: boolean;
    recovering: boolean;
    readonly autorecover: boolean;
    private _creating = 0;
    ready = false;
    paused = true;
    stopped = false;
    slicersDone = false;
    private slicersFailed = false;
    private queue = new Queue<Slice>();
    private recover: RecoveryModule;
    private stateStorage!: StateStorage;
    private executionStorage!: ExecutionStorage;
    private _resolveRun = noop;
    private _processCleanup = noop;
    private startingPoints: SlicerRecoveryData[] = [];

    constructor(context: Context, executionContext: SlicerExecutionContext) {
        this.context = context;
        this.logger = makeLogger(context, 'execution_scheduler');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.exId = executionContext.exId;
        this.recover = new RecoveryModule(context, executionContext);
        const recoverFromExId = get(executionContext.config, 'recovered_execution');
        const slicerCanRecover = executionContext.slicer().isRecoverable();

        if (recoverFromExId && !slicerCanRecover) {
            throw new Error('Slicer is not recoverable');
        }

        this.recoverFromExId = recoverFromExId;
        this.recoverExecution = Boolean(recoverFromExId && slicerCanRecover);
        this.recovering = Boolean(this.recoverExecution);
        this.autorecover = Boolean(executionContext.config.autorecover);
        this._processSlicers();
    }

    /**
     * Initialize the recovery instance or the execution context,
     * if recovery is initialized, the execution context will not be
     * initialized until the execution if finished and the cleanup
     * type is set.
    */
    async initialize(stateStorage: StateStorage, executionStorage: ExecutionStorage) {
        this.stateStorage = stateStorage;
        this.executionStorage = executionStorage;

        if (this.recoverExecution) {
            await this._initializeRecovery();
            return;
        }

        await this._initializeExecution();
    }

    /**
     * Run the execution, this will block until complete (or failed)
    */
    async run() {
        if (this.recoverExecution) {
            await this.executionStorage.setStatus(this.exId, 'recovering');

            this.logger.info(`execution: ${this.exId} is starting in recovery mode`);
            this.ready = true;
            this.start();

            await this._waitForRecovery();
            await this._recoveryComplete();

            if (this.recover.exitAfterComplete()) {
                return;
            }

            await this._initializeExecution();
        }

        await this.executionStorage.setStatus(this.exId, 'running');
        this.ready = true;

        const promise = new Promise((resolve) => {
            const handler = (err: Error) => {
                if (err) {
                    this.slicersFailed = true;
                } else {
                    this.slicersDone = true;
                }
                this._resolveRun();
                this._resolveRun = noop;
            };

            this._resolveRun = () => {
                this.events.removeListener('slicers:finished', handler);
                resolve(true);
            };

            this.events.once('slicers:finished', handler);
        });

        this.start();

        this.logger.trace('running the scheduler');

        await promise;

        const n = this.pendingSlices + this.pendingSlicerCount;
        this.logger.debug(
            `execution ${this.exId} is finished scheduling, ${n} remaining slices in the queue`
        );

        await pWhile(async () => {
            if (!this._creating) {
                this.logger.debug('done creating remaining slices');
                return true;
            }
            this.logger.debug(`waiting for ${this._creating} remaining slices to be created...`);
            await pDelay(100);
            return false;
        });
    }

    start() {
        this.paused = false;
    }

    async stop() {
        if (this.stopped) return;

        this.logger.debug('stopping scheduler...');

        this.stopped = true;

        const drain = this._drainPendingSlices(false);

        this._processCleanup();
        this._processCleanup = noop;
        this._resolveRun();
        this._resolveRun = noop;

        await drain;
    }

    pause() {
        this.paused = true;
    }

    get maxQueueLength() {
        return this.executionContext.slicer().maxQueueLength();
    }

    get queueLength() {
        return this.queue.size();
    }

    get isQueueFull() {
        const maxLength = this.maxQueueLength;
        return this.pendingSlices + this.pendingSlicerCount > maxLength;
    }

    get pendingSlicerCount() {
        if (!this.ready) return 0;

        if (this.recovering && this.recover) {
            return this.recover.sliceCount();
        }

        return this.executionContext.slicer().sliceCount();
    }

    get pendingSlices() {
        return this.queueLength + this._creating;
    }

    get queueRemainder() {
        const remainder = this.maxQueueLength - this.pendingSlices;
        return remainder > 0 ? remainder : 0;
    }

    get isFinished() {
        const isDone = this.slicersDone || this.slicersFailed || this.stopped;
        return isDone && !this.pendingSlices;
    }

    canAllocateSlice() {
        return this.ready && !this.paused && !this.isQueueFull;
    }

    canComplete() {
        const { lifecycle } = this.executionContext.config;
        return this.ready && lifecycle === 'once' && !this.recovering;
    }

    isRecovering() {
        return this.ready && this.recovering;
    }

    async shutdown() {
        await this.stop();

        if (this.recover) {
            try {
                await this.recover.shutdown();
            } catch (err) {
                logError(this.logger, err, 'failed to shutdown recovery');
            }
        }

        this.queue.each((slice: Slice) => {
            this.queue.remove(slice.slice_id, 'slice_id');
        });
    }

    getSlices(limit = 1) {
        if (this.queue.size() === 0) return [];
        if (limit < 1) return [];

        const slices: Slice[] = [];

        for (let i = 0; i < limit; i += 1) {
            const slice = this.queue.dequeue();
            if (slice == null) break;

            slices.push(slice);
        }

        if (slices.length > 0) {
            this.events.emit('slicers:queued', this.queueLength);
        }

        return slices;
    }

    enqueueSlice(slice: Slice, addToStart?: boolean) {
        return this.enqueueSlices([slice], addToStart);
    }

    enqueueSlices(slices: Slice[], addToStart = false) {
        if (this.stopped) return;

        slices.forEach((slice) => {
            if (this.queue.exists('slice_id', slice.slice_id)) {
                this.logger.warn(`slice ${slice.slice_id} has already been enqueued`);
                return;
            }

            this.logger.trace('enqueuing slice', slice);

            if (addToStart) {
                this.queue.unshift(slice);
            } else {
                this.queue.enqueue(slice);
                this.executionContext.onSliceEnqueued(slice);
            }
        });

        this.events.emit('slicers:queued', this.queueLength);
    }

    _processSlicers() {
        const { events, logger, exId } = this;

        let _handling = false;
        let _finished = false;

        let createInterval: NodeJS.Timeout | undefined;
        let handleInterval: NodeJS.Timeout | undefined;

        const resetCleanup = () => {
            this._processCleanup = noop;
        };

        const cleanup = () => {
            clearInterval(createInterval);
            createInterval = undefined;
            clearInterval(handleInterval);
            handleInterval = undefined;
            resetCleanup();
        };

        const drain = () => {
            const n = this.pendingSlicerCount;
            if (n) {
                logger.debug(`draining the remaining ${n} pending slices from the slicer`);
            }
            return this._drainPendingSlices(false);
        };

        const onSlicerFinished = async () => {
            cleanup();
            logger.info(`all slicers for execution: ${exId} have been completed`);

            await drain();
            events.emit('slicers:finished');
        };

        const onSlicerFailure = async (err: Error) => {
            cleanup();
            logger.warn('slicer failed', toString(err));

            await drain();

            // before removing listeners make sure we've received all of the events
            await pDelay(100);
            events.emit('slicers:finished', err);
        };

        const makeSlices = async () => {
            try {
                if (this.recovering && this.recover) {
                    _finished = await this.recover.handle();
                } else {
                    _finished = await this.executionContext.slicer().handle();
                }
            } catch (err) {
                await onSlicerFailure(err);
                return;
            }

            if (!_finished) {
                return;
            }

            if (!this.recovering) {
                clearInterval(handleInterval);
                handleInterval = undefined;
            }

            if (this.canComplete()) {
                await onSlicerFinished();
            }
        };

        handleInterval = setInterval(() => {
            if (!this.canAllocateSlice()) return;
            if (_handling) return;

            _handling = true;

            makeSlices()
                .then(() => {
                    _handling = false;
                })
                .catch((err) => {
                    _handling = false;
                    logError(this.logger, err, 'failure to run slicers');
                });
        }, 3);

        createInterval = setInterval(() => {
            if (!this.pendingSlicerCount) return;

            this._drainPendingSlices().catch(onSlicerFailure);
        }, 5);

        this._processCleanup = cleanup;
    }

    async _drainPendingSlices(once = true) {
        const slices = this._getPendingSlices();
        if (!slices.length) return;

        await this._createSlices(slices);

        if (once) return;

        await this._drainPendingSlices();
    }

    _getPendingSlices() {
        if (!this.ready) return [];

        if (this.recovering && this.recover) {
            return this.recover.getSlices(this.queueRemainder);
        }

        return this.executionContext.slicer().getSlices(this.queueRemainder);
    }

    async _createSlices(allSlices: Slice[]) {
        // filter out anything that doesn't need to be created
        const slices: Slice[] = [];

        for (const slice of allSlices) {
            // In the case of recovery slices have already been
            // created, so its important to skip this step
            if (slice._created) {
                this.enqueueSlice(slice);
            } else {
                slice._created = makeISODate();
                slices.push(slice);
            }
        }

        if (!slices.length) return;

        this._creating += slices.length;

        try {
            const count = await this.stateStorage.createSlices(this.exId, slices);
            this.enqueueSlices(slices);
            this._creating -= count;
        } catch (err) {
            const { lifecycle } = this.executionContext.config;
            if (lifecycle === 'once') {
                throw err;
            } else {
                logError(this.logger, err, 'failure creating slices');
            }
        }
    }

    async _initializeRecovery() {
        await this.recover.initialize(this.stateStorage);

        const { slicers: prevSlicers } = await this.executionStorage.get(
            this.recoverFromExId as string
        );

        this.events.emit('slicers:registered', prevSlicers);
    }

    async _initializeExecution() {
        await this.executionContext.initialize(this.startingPoints);
        const slicers = this.executionContext.slicer().slicers();
        this.events.emit('slicers:registered', slicers);
    }

    async _waitForRecovery() {
        if (!this.recoverExecution) return;

        if (!this.recover.recoveryComplete()) {
            await new Promise((resolve) => {
                this.events.once('execution:recovery:complete', () => {
                    resolve(true);
                });
            });
        }
    }

    async _recoveryComplete() {
        this.recovering = false;
        this.ready = false;

        if (this.recover.exitAfterComplete()) {
            this.logger.warn('execution recovery has been marked as completed');
            this.slicersDone = true;
            this._processCleanup();
            this._processCleanup = noop;
            this._resolveRun();
            this._resolveRun = noop;
            return;
        }

        const { slicers: prevSlicers } = await this.executionStorage.get(
            this.recoverFromExId as string
        );
        this.startingPoints = await this.stateStorage.getStartingPoints(
            this.recoverFromExId as string,
            prevSlicers,
        );

        this.logger.info(`execution: ${this.exId} finished its recovery`);
    }
}
