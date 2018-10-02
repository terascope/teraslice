'use strict';

const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const Promise = require('bluebird');
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

        this.logger.debug(`execution ${this.exId} is finished scheduling, ${this.queueLength} remaining slices in the queue`);
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
        return this.queueLength > this.executionContext.queueLength;
    }

    get isFinished() {
        return (this.slicersDone || this.slicersFailed || this.stopped) && this.queueLength === 0;
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

    getSlice() {
        const [slice] = this.getSlices(1);
        return slice;
    }

    getSlices(limit = 1) {
        if (this.queue.size() === 0) return [];

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
        let backupTimer;

        const slicerCount = () => this.slicers.length;
        const getSlicerIds = () => _.map(_.filter(this.slicers, { finished: false }), 'id');

        let pendingSlicers = [];

        const getAllocationCount = () => {
            if (!canAllocateSlice()) return 0;

            const count = this.executionContext.queueLength - this.queueLength;
            if (count > pendingSlicers.length) {
                return pendingSlicers.length;
            }
            if (count < 0) return 0;
            return count;
        };

        function runPendingSlicers() {
            // make sure never a miss anything
            clearTimeout(backupTimer);
            backupTimer = setTimeout(() => {
                runPendingSlicers();
            }, 100);

            if (!pendingSlicers.length) return;

            const count = getAllocationCount();
            if (!count) return;

            const slicersToRun = _.take(pendingSlicers, count);
            pendingSlicers = _.without(pendingSlicers, ...slicersToRun);

            slicersToRun.forEach((id) => {
                _runSlicer(id);
            });
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

            logger.info(`a slicer ${slicerId} for execution: ${exId} has completed its range`);

            if (slicersDone === slicerCount()) {
                clearTimeout(backupTimer);
                logger.info(`all slicers for execution: ${exId} have been completed`);

                // before removing listeners make sure we've received all of the events
                setTimeout(() => {
                    events.emit('slicers:finished');
                    cleanup();
                }, 100);
            }
        }

        function onSlicerFailure(err, slicerId) {
            clearTimeout(backupTimer);
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
            clearTimeout(backupTimer);

            pendingSlicers = [];

            events.removeListener('slicer:done', onSlicersDone);
            events.removeListener('slicer:finished', onSlicerFinished);
            events.removeListener('slicer:failure', onSlicerFailure);

            events.removeListener('slicers:start', onSlicersStart);
            events.removeListener('slicers:queued', runPendingSlicers);
            events.removeListener('slicers:registered', onRegisteredSlicers);
            resetCleanup();
        }

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

                const slices = _.map(_.castArray(result), (sliceRequest) => {
                    slicer.order += 1;

                    // recovery slices already have correct meta data
                    if (sliceRequest.slice_id) {
                        return sliceRequest;
                    }

                    return {
                        slice_id: uuidv4(),
                        request: sliceRequest,
                        slicer_id: slicer.id,
                        slicer_order: slicer.order,
                    };
                });

                this.enqueueSlices(slices);
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
}

module.exports = Scheduler;
