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
        this.slicers = [];

        this.recovering = false;
        this.ready = false;
        this.paused = true;
        this.stopped = false;
        this.slicersDone = false;
        this.slicersFailed = false;
        this._resolveRun = () => {};
        this._processCleanup = () => {};

        this.queue = new Queue();

        autoBind(this);
    }

    async run() {
        if (!this.ready) {
            throw new Error('Scheduler needs to have registered slicers first');
        }

        const promise = new Promise((resolve) => {
            this._resolveRun = () => resolve();

            this.events.once('slicers:finished', (err) => {
                if (err) {
                    this.slicersFailed = true;
                } else {
                    this.slicersDone = true;
                }
                resolve();
            });
        });

        this._processSlicers();
        this.start();

        this.logger.debug('running the scheduler');

        await promise;
    }

    start() {
        this.paused = false;
        this.events.emit('slicers:start');
    }

    stop() {
        this.stopped = true;

        this._processCleanup();
        this._processCleanup = () => {};

        this._resolveRun();
        this._resolveRun = () => {};
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
        return (lifecycle === 'once') && !this.recovering;
    }

    registerSlicers(slicerFns, recovering = false) {
        const { config } = this.executionContext;
        if (!_.isArray(slicerFns)) {
            throw new Error(`newSlicer from module ${config.operations[0]._op} needs to return an array of slicers`);
        }

        this.recovering = recovering;

        this.slicers = slicerFns.map((fn, id) => this._registerSlicer(fn, id));

        const count = _.size(this.slicers);

        this.logger.debug(`registered ${count} slicers`);

        this.events.emit('slicers:registered', count);
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

            this.logger.debug('enqueuing slice', slice);

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
        } = this;

        let slicersDone = 0;

        let pendingSlicers = [];

        const getSlicers = () => this.slicers;
        const getSlicerIds = () => _.map(this.slicers, 'id');

        const runSlicer = (id) => {
            const slicer = _.find(this.slicers, { id });
            if (slicer == null) {
                throw new Error(`Unable to find slicer by id ${id}`);
            }

            return slicer.handle();
        };

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
            if (!pendingSlicers.length) return;

            const count = getAllocationCount();
            const slicersToRun = _.take(pendingSlicers, count);
            pendingSlicers = _.without(pendingSlicers, ...slicersToRun);

            slicersToRun.forEach((id) => {
                runSlicer(id);
            });
        }

        function setupSlicers() {
            slicersDone = 0;
            pendingSlicers = _.union(pendingSlicers, getSlicerIds());
            runPendingSlicers();
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

            if (slicersDone === getSlicers().length) {
                logger.info(`all slicers for execution: ${exId} have been completed`);

                // before removing listeners make sure we've received all of the events
                setTimeout(() => {
                    events.emit('slicers:finished');
                    cleanup();
                }, 100);
            }
        }

        function onSlicerFailure(err, slicerId) {
            logger.warn(`slicer ${slicerId} failed`, _.toString(err));

            // before removing listeners make sure we've received all of the events
            setTimeout(() => {
                events.emit('slicers:finished', err);
                cleanup();
            }, 100);
        }

        events.on('slicer:done', onSlicersDone);
        events.on('slicer:finished', onSlicerFinished);
        events.on('slicer:failure', onSlicerFailure);

        events.on('slicers:start', onSlicersStart);
        events.on('slicers:queued', runPendingSlicers);
        events.on('slicers:registered', setupSlicers);

        function cleanup() {
            pendingSlicers = [];

            events.removeListener('slicer:done', onSlicersDone);
            events.removeListener('slicer:finished', onSlicerFinished);
            events.removeListener('slicer:failure', onSlicerFailure);

            events.removeListener('slicers:start', onSlicersStart);
            events.removeListener('slicers:queued', runPendingSlicers);
            events.removeListener('slicers:registered', setupSlicers);
        }

        setupSlicers();

        this._processCleanup = cleanup;
    }

    _registerSlicer(slicerFn, id) {
        const {
            events,
            logger,
            enqueueSlices,
            canComplete
        } = this;

        const slicer = {
            id,
            order: 0,
            handle,
        };

        async function handle() {
            logger.trace(`slicer ${slicer.id} is being called`);
            try {
                const result = await slicerFn();

                logger.trace(`slicer ${slicer.id} was called`, { result });

                // not null or undefined
                if (result != null) {
                    if (_.isArray(result)) {
                        events.emit('slicer:subslice');
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

                    enqueueSlices(slices);
                } else if (canComplete()) {
                    logger.trace(`slicer ${slicer.id} finished`);
                    events.emit('slicer:finished', slicer.id);
                    return;
                }
            } catch (err) {
                events.emit('slicer:failure', err, slicer.id);
                return;
            }

            events.emit('slicer:done', slicer.id);
        }

        return slicer;
    }
}

module.exports = Scheduler;
