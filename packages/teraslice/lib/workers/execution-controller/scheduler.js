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

        // FIXME: remove
        this.logger.debug('SCHEDULER DONE');
    }

    start() {
        this.paused = false;
        this.events.emit('slicers:start');
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
        return (this.slicersDone || this.slicersFailed) && this.queueLength === 0;
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

        this.events.emit('slicers:length', count);
        this.ready = true;
    }

    cleanup() {
        // FIXME: should be trace
        this.logger.debug('cleaning up scheduler...');

        this.paused = true;

        this._processCleanup();
        this._resolveRun();

        this.queue.each((slice) => {
            this.queue.remove(slice.slice_id, 'slice_id');
        });

        this.slicers.length = 0;
    }


    getSlice() {
        const slice = this.queue.dequeue();
        if (slice) {
            this.events.emit('slicers:queued', this.queueLength);
        }
        return slice;
    }

    getSlicers() {
        return this.slicers;
    }

    runSlicer(id) {
        const slicer = _.find(this.slicers, { id });
        if (slicer == null) {
            throw new Error(`Unable to find slicer by id ${id}`);
        }

        // FIXME: remove
        this.logger.debug(`RUNNING SLICER ${id}!`);
        return slicer.handle();
    }

    enqueueSlice(slice, addToStart = false) {
        if (this.queue.exists('slice_id', slice.slice_id)) {
            this.logger.warn(`slice ${slice.slice_id} has already been enqueued`);
            return;
        }

        this.logger.trace('enqueuing slice', slice);
        this.events.emit('slicers:queued', this.queueLength);

        if (addToStart) {
            this.queue.unshift(slice);
        } else {
            this.queue.enqueue(slice);
        }
    }

    _processSlicers() {
        const {
            events,
            logger,
            exId,
            runSlicer,
            getSlicers,
            canAllocateSlice,
        } = this;

        let slicersDone = 0;

        const pendingSlicers = [];

        function onQueueLengthChange() {
            if (canAllocateSlice() && pendingSlicers.length > 0) {
                runSlicer(pendingSlicers.shift());
            }
        }

        function onSlicersStart() {
            pendingSlicers.slice().forEach(id => runSlicer(id));
            pendingSlicers.length = 0;
        }

        function onSlicersDone(slicerId) {
            if (canAllocateSlice()) {
                runSlicer(slicerId);
            } else {
                pendingSlicers.push(slicerId);
            }
        }

        function onSlicerFinished(slicerId) {
            slicersDone += 1;
            logger.info(`a slicer ${slicerId} for execution: ${exId} has completed its range`);

            if (slicersDone === getSlicers().length) {
                cleanup();
                logger.info(`all slicers for execution: ${exId} have been completed`);
                events.emit('slicers:finished');
            }
        }

        function onSlicerFailure(err, slicerId) {
            logger.warn(`slicer ${slicerId} failed`, _.toString(err));
            events.emit('slicers:finished', err);
            cleanup();
        }

        events.on('slicer:done', onSlicersDone);
        events.on('slicer:finished', onSlicerFinished);
        events.on('slicer:failure', onSlicerFailure);

        events.on('slicers:start', onSlicersStart);
        events.on('slicers:queued', onQueueLengthChange);

        function cleanup() {
            pendingSlicers.length = 0;

            events.removeListener('slicer:done', onSlicersDone);
            events.removeListener('slicer:finished', onSlicerFinished);
            events.removeListener('slicer:failure', onSlicerFailure);

            events.removeListener('slicers:start', onSlicersStart);
            events.removeListener('slicers:queued', onQueueLengthChange);
        }

        const slicerIds = _.map(getSlicers(), 'id');

        pendingSlicers.push(...slicerIds);

        this._processCleanup = cleanup;
    }

    _registerSlicer(slicerFn, id) {
        const {
            events,
            logger,
            enqueueSlice,
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

                    _.each(_.castArray(result), (sliceRequest) => {
                        slicer.order += 1;
                        let slice = sliceRequest;

                        // recovery slices already have correct meta data
                        if (!slice.slice_id) {
                            slice = {
                                slice_id: uuidv4(),
                                request: sliceRequest,
                                slicer_id: slicer.id,
                                slicer_order: slicer.order,
                            };
                        }
                        enqueueSlice(slice);
                    });
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
