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

        this.logger.debug(`execution ${this.exId} is finished scheduling, ${this.queueLength + this._creating} remaining slices in the queue`);

        const waitForCreating = () => {
            const is = () => this._creating;
            return pWhilst(is, () => Promise.delay(100));
        };

        await waitForCreating();
    }

    start() {
        this.paused = false;
    }

    stop() {
        if (this.stopped) return;

        this.logger.debug('stopping scheduler...');

        this.stopped = true;

        this._processCleanup();
        this._processCleanup = _.noop;
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
        return (this._creating + this.queueLength) > maxLength;
    }

    get isFinished() {
        const isDone = this.slicersDone || this.slicersFailed || this.stopped;
        return isDone && !this.queueLength && !this._creating;
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
        this.stop();

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

        const resetCleanup = () => {
            this._processCleanup = _.noop;
        };

        const queueRemainder = () => this.maxQueueLength - this.queueLength - this._creating;

        const makeSlices = async () => {
            if (!this.ready) return;
            let finished = false;

            try {
                if (this.recovering && this.recover) {
                    finished = await this.recover.handle();
                } else {
                    finished = await this.executionContext.slicer.handle();
                }
            } catch (err) {
                await onSlicerFailure(err);
                return;
            }

            if (finished && this.canComplete()) {
                await onSlicerFinished();
            }
        };

        const getSlices = () => {
            if (!this.ready) return [];

            const remainder = queueRemainder();

            if (this.recovering && this.recover) {
                return this.recover.getSlices(remainder);
            }

            return this.executionContext.slicer.getSlices(remainder);
        };

        let interval;

        const queueWillBeFull = () => queueRemainder() < this.executionContext.config.slicers;

        const drainPendingSlices = async () => {
            const slices = getSlices();
            if (!slices.length) return;

            await this._createSlices(slices);
            await drainPendingSlices();
        };

        async function onSlicerFinished() {
            clearInterval(interval);
            logger.info(`all slicers for execution: ${exId} have been completed`);

            await drainPendingSlices();

            events.emit('slicers:finished');
            cleanup();
        }

        async function onSlicerFailure(err) {
            clearInterval(interval);
            logger.warn('slicer failed', _.toString(err));

            // before removing listeners make sure we've received all of the events
            await Promise.delay(100);
            events.emit('slicers:finished', err);
            cleanup();
        }

        function cleanup() {
            clearInterval(interval);
            resetCleanup();
        }

        // make sure never a miss anything
        interval = setInterval(() => {
            if (!this.canAllocateSlice() || queueWillBeFull()) return;

            Promise.all([
                this._createSlices(getSlices()),
                makeSlices(),
            ]).catch(err => this.logger.error('failure to run slicers', err));
        }, 5);

        this._processCleanup = cleanup;
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
