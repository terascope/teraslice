'use strict';

const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const Promise = require('bluebird');
const pWhilst = require('p-whilst');
const autoBind = require('auto-bind');
const Queue = require('@terascope/queue');
const { makeLogger } = require('../helpers/terafoundation');

class Scheduler {
    constructor(context, executionContext) {
        this.logger = makeLogger(context, executionContext, 'execution_scheduler');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.exId = executionContext.ex_id;
        this.recoverExecution = _.get(executionContext.config, 'recovered_execution', false);
        this.recovering = this.recoverExecution;
        this.slicers = [];

        this._creating = 0;
        this.ready = false;
        this.paused = true;
        this.stopped = false;
        this.slicersDone = false;
        this.slicersFailed = false;
        this._resolveRun = () => {};
        this._processCleanup = () => {};

        this.queue = new Queue();

        autoBind(this);

        this._processSlicers();
    }

    async run() {
        if (!this.ready) {
            throw new Error('Scheduler needs to have registered slicers first');
        }

        const promise = new Promise((resolve) => {
            const handler = (err) => {
                if (err) {
                    this.slicersFailed = true;
                } else {
                    this.slicersDone = true;
                }
                this._resolveRun();
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
        this.events.emit('slicers:start');
    }

    stop() {
        if (this.stopped) return;

        this.logger.debug('stopping scheduler...');

        this.stopped = true;

        this._processCleanup();
        this._resolveRun();
    }

    pause() {
        this.paused = true;
    }

    get queueLength() {
        return this.queue.size();
    }

    get isQueueFull() {
        const maxLength = this.executionContext.queueLength;
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

    async markRecoveryAsComplete(exitAfterComplete) {
        this.recovering = false;
        this.ready = false;

        this.slicers.forEach((slicer) => {
            slicer.finished = true;
        });

        if (exitAfterComplete) {
            this.logger.warn('execution recovery has been marked as completed');
            this.slicersDone = true;
            this._processCleanup();
            this._resolveRun();
            return;
        }

        this.logger.info(`execution ${this.exId} finished its recovery`);

        // for whatever reason this needs to be here
        await Promise.delay(100);
    }

    registerSlicers(slicerFns) {
        const { config } = this.executionContext;
        if (!_.isArray(slicerFns)) {
            throw new Error(`newSlicer from module ${config.operations[0]._op} needs to return an array of slicers`);
        }

        if (this.slicers.length > 0) {
            this.slicers.forEach((slicer, id) => {
                this.logger.trace(`recoverying slicer ${id}`);

                slicer.slicerFn = slicerFns[id];
                slicer.finished = false;
            });
        } else {
            this.slicers = slicerFns.map((slicerFn, id) => ({
                id,
                order: 0,
                slicerFn,
                finished: false,
            }));
        }

        this.events.emit('slicers:registered', this.slicers.length);
        this.ready = true;
    }

    cleanup() {
        this.stop();

        this.queue.each((slice) => {
            this.queue.remove(slice.slice_id, 'slice_id');
        });

        this.slicers.length = 0;
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

        _.forEach(slices, (slice) => {
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
            canAllocateSlice,
            _runSlicer,
        } = this;

        const resetCleanup = () => {
            this._processCleanup = () => {};
        };

        let slicersDone = 0;
        let backupInterval;

        const slicerCount = () => this.slicers.length;
        const getSlicerIds = () => _.map(_.filter(this.slicers, { finished: false }), 'id');

        let pendingSlicers = [];

        const getAllocationCount = () => {
            if (!canAllocateSlice()) return 0;

            const count = this.executionContext.queueLength - this.queueLength - this._creating;
            if (count > pendingSlicers.length) {
                return pendingSlicers.length;
            }
            if (count < 0) return 0;
            return count;
        };

        function runPendingSlicers() {
            if (!pendingSlicers.length) return;

            const count = getAllocationCount();
            if (!count) return;

            const slicersToRun = _.take(pendingSlicers, count);
            pendingSlicers = _.without(pendingSlicers, ...slicersToRun);

            slicersToRun.forEach(_runSlicer);
        }

        function onSlicersStart() {
            runPendingSlicers();
        }

        function onSlicersDone(slicerId) {
            pendingSlicers = _.union(pendingSlicers, [slicerId]);
            runPendingSlicers();
        }

        function onSlicerFinished(slicerId) {
            slicersDone += 1;

            logger.info(`slicer ${slicerId} for execution: ${exId} has completed its range`);

            if (slicersDone === slicerCount()) {
                clearInterval(backupInterval);
                logger.info(`all slicers for execution: ${exId} have been completed`);

                // before removing listeners make sure we've received all of the events
                setTimeout(() => {
                    events.emit('slicers:finished');
                    cleanup();
                }, 100);
            }
        }

        function onSlicerFailure(err, slicerId) {
            clearInterval(backupInterval);
            logger.warn(`slicer ${slicerId} failed`, _.toString(err));

            // before removing listeners make sure we've received all of the events
            setTimeout(() => {
                events.emit('slicers:finished', err);
                cleanup();
            }, 100);
        }

        function onRegisteredSlicers(count) {
            logger.debug(`registered ${count} slicers`);

            pendingSlicers = getSlicerIds();
        }

        events.on('slicer:done', onSlicersDone);
        events.on('slicer:finished', onSlicerFinished);
        events.on('slicer:failure', onSlicerFailure);

        events.on('slicers:start', onSlicersStart);
        events.on('slicers:queued', runPendingSlicers);
        events.on('slicers:registered', onRegisteredSlicers);

        function cleanup() {
            clearInterval(backupInterval);

            pendingSlicers = [];

            events.removeListener('slicer:done', onSlicersDone);
            events.removeListener('slicer:finished', onSlicerFinished);
            events.removeListener('slicer:failure', onSlicerFailure);

            events.removeListener('slicers:start', onSlicersStart);
            events.removeListener('slicers:queued', runPendingSlicers);
            events.removeListener('slicers:registered', onRegisteredSlicers);
            resetCleanup();
        }

        // make sure never a miss anything
        backupInterval = setInterval(() => {
            runPendingSlicers();
        }, 500);

        this._processCleanup = cleanup;
    }

    async _runSlicer(id) {
        const slicer = _.find(this.slicers, { id });
        if (slicer.finished) return;

        this.logger.trace(`slicer ${slicer.id} is being called`);
        try {
            const result = await slicer.slicerFn();

            this.logger.trace(`slicer ${slicer.id} was called`, { result });

            // not null or undefined
            if (result != null) {
                if (_.isArray(result)) {
                    this.events.emit('slicer:subslice');
                }

                this._createSlices(slicer, _.castArray(result));
            } else if (this.canComplete() && !slicer.finished) {
                slicer.finished = true;
                this.logger.trace(`slicer ${slicer.id} finished`);
                this.events.emit('slicer:finished', slicer.id);
                return;
            }
        } catch (err) {
            this.events.emit('slicer:failure', err, slicer.id);
            return;
        }

        this.events.emit('slicer:done', slicer.id);
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

    _createSlicesState(slices) {
        slices.forEach((slice) => {
            this._ensureSliceState(slice)
                .then(this.enqueueSlice)
                .catch((err) => {
                    this.logger.error('error enqueuing slice', err);
                })
                .finally(() => {
                    this._creating -= 1;
                });
        });
    }

    _createSlices(slicer, result) {
        const slices = result.map((request) => {
            slicer.order += 1;

            // recovery slices already have correct meta data
            if (request.slice_id) {
                return request;
            }

            return {
                slice_id: uuidv4(),
                slicer_id: slicer.id,
                slicer_order: slicer.order,
                request,
            };
        });

        // create the slice state in the background
        this._creating += result.length;
        process.nextTick(this._createSlicesState, slices);
    }
}

module.exports = Scheduler;
