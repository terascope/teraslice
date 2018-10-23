'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const pWhilst = require('p-whilst');
const Queue = require('@terascope/queue');
const makeExecutionRecovery = require('./recovery');
const { makeLogger } = require('../helpers/terafoundation');

class Scheduler {
    constructor(context, executionContext) {
        this.context = context;
        this.logger = makeLogger(context, executionContext, 'execution_scheduler');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.exId = executionContext.exId;
        this.recoverExecution = _.get(executionContext.config, 'recovered_execution', false);
        this.recovering = this.recoverExecution;

        this._creating = 0;
        this.ready = false;
        this.paused = true;
        this.stopped = false;
        this.slicersDone = false;
        this.slicersFailed = false;
        this.queue = new Queue();
        this.startingPoints = [];

        this._resolveRun = _.noop;
        this._processCleanup = _.noop;

        this._processSlicers();
    }

    async run() {
        if (this.recoverExecution) {
            await this._recoverSlices();

            if (this.recover.exitAfterComplete()) {
                return;
            }
        }

        this.events.emit('slicers:registered', this.executionContext.slicer.slicers);
        await this.executionContext.initialize(this.startingPoints);

        this.ready = true;

        const promise = new Promise((resolve) => {
            const handler = (err) => {
                if (err) {
                    this.slicersFailed = true;
                } else {
                    this.slicersDone = true;
                }
                this._resolveRun();
                this._resolveRun = _.noop;
            };

            this._resolveRun = () => {
                this.events.removeListener('slicers:finished', handler);
                resolve();
            };

            this.events.once('slicers:finished', handler);
        });

        this.start();

        this.logger.trace('running the scheduler');

        await promise;

        this.logger.debug(`execution ${this.exId} is finished scheduling, ${this.pendingSlices + this.pendingSlicerCount} remaining slices in the queue`);

        const waitForCreating = () => {
            const is = () => this._creating + this.pendingSlicerCount;
            return pWhilst(is, () => Promise.delay(100));
        };

        await waitForCreating();
    }

    start() {
        this.paused = false;
    }

    async stop() {
        if (this.stopped) return;

        this.logger.debug('stopping scheduler...');

        this.stopped = true;

        this._processCleanup();
        this._processCleanup = _.noop;

        await this._drainPendingSlices(false);

        this._resolveRun();
        this._resolveRun = _.noop;
    }

    pause() {
        this.paused = true;
    }

    get maxQueueLength() {
        return this.executionContext.slicer.maxQueueLength();
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

        return this.executionContext.slicer.sliceCount();
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
        return this.ready && (lifecycle === 'once') && !this.recovering;
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
                this.logger.error('failed to shutdown recovery', err);
            }
        }

        this.queue.each((slice) => {
            this.queue.remove(slice.slice_id, 'slice_id');
        });

        this.stateStore = null;
    }

    getSlices(limit = 1) {
        if (this.queue.size() === 0) return [];
        if (limit < 1) return [];

        const slices = [];

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

    enqueueSlice(slice, addToStart) {
        return this.enqueueSlices([slice], addToStart);
    }

    enqueueSlices(slices, addToStart = false) {
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
            }
        });

        this.events.emit('slicers:queued', this.queueLength);
    }

    _processSlicers() {
        const {
            events,
            logger,
            exId,
        } = this;

        let _handling = false;
        let _finished = false;

        let createInterval;
        let handleInterval;

        const resetCleanup = () => {
            this._processCleanup = _.noop;
        };

        const cleanup = () => {
            clearInterval(createInterval);
            createInterval = null;
            clearInterval(handleInterval);
            handleInterval = null;
            resetCleanup();
        };

        const onSlicerFinished = async () => {
            cleanup();
            logger.info(`all slicers for execution: ${exId} have been completed`);

            await this._drainPendingSlices(false);

            events.emit('slicers:finished');
        };

        const onSlicerFailure = async (err) => {
            cleanup();
            logger.warn('slicer failed', _.toString(err));

            // before removing listeners make sure we've received all of the events
            await Promise.delay(100);
            events.emit('slicers:finished', err);
        };

        const makeSlices = async () => {
            try {
                if (this.recovering && this.recover) {
                    _finished = await this.recover.handle();
                } else {
                    _finished = await this.executionContext.slicer.handle();
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
                handleInterval = null;
            }

            if (this.canComplete()) {
                await onSlicerFinished();
            }
        };

        handleInterval = setInterval(() => {
            if (!this.canAllocateSlice()) return;
            if (_handling) return;

            this.logger.trace('LOOP', {
                _handling,
                _finished,
                recovering: this.recovering,
                pending: this.pendingSlices,
                pendingSlicerCount: this.pendingSlicerCount,
                queueLength: this.queueLength,
                remaining: this.queueRemainder,
                _creating: this._creating,
                maxQueueLength: this.maxQueueLength
            });

            _handling = true;

            makeSlices()
                .then(() => { _handling = false; })
                .catch((err) => {
                    _handling = false;
                    this.logger.error('failure to run slicers', err);
                });
        }, 3);

        createInterval = setInterval(() => {
            if (!this.pendingSlicerCount) return;

            this._drainPendingSlices()
                .catch(err => this.logger.error('failure creating slices', err));
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

        return this.executionContext.slicer.getSlices(this.queueRemainder);
    }

    // In the case of recovery slices have already been
    // created, so its important to skip this step
    _ensureSliceState(slice) {
        if (slice._created) return Promise.resolve(slice);

        slice._created = new Date().toISOString();

        // this.stateStore is attached from the execution_controller
        return this.stateStore.createState(this.exId, slice, 'start')
            .then(() => slice);
    }

    _createSlices(slices) {
        this._creating += slices.length;

        const promises = slices.map(slice => this._ensureSliceState(slice)
            .then(_slice => this.enqueueSlice(_slice))
            .finally(() => {
                this._creating -= 1;
            }));

        return Promise.all(promises);
    }

    async _recoverSlices() {
        this.recover = this.recover || makeExecutionRecovery(
            this.context,
            this.stateStore,
            this.executionContext
        );

        await this.recover.initialize();

        this.events.emit('slicers:registered', 1);

        this.logger.info(`execution: ${this.exId} is starting in recovery mode`);
        this.ready = true;
        this.start();

        await this._waitForRecovery();
        await this._recoveryComplete();
    }

    async _waitForRecovery() {
        if (!this.recoverExecution) return;

        if (!this.recover.recoveryComplete()) {
            await new Promise((resolve) => {
                this.events.once('execution:recovery:complete', () => {
                    resolve();
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
            this._processCleanup = _.noop;
            this._resolveRun();
            this._resolveRun = _.noop;
            return;
        }

        this.startingPoints = await this.recover.getSlicerStartingPosition();

        this.logger.info(`execution ${this.exId} finished its recovery`);
    }
}

module.exports = Scheduler;
