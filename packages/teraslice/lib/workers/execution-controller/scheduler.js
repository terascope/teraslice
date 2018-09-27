'use strict';

const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const PQueue = require('p-queue');
const pWhilst = require('p-whilst');
const Promise = require('bluebird');
const Queue = require('@terascope/queue');
const { makeLogger } = require('../helpers/terafoundation');

class Scheduler {
    constructor(context, executionContext) {
        this.logger = makeLogger(context, executionContext, 'execution_scheduler');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.exId = executionContext.ex_id;

        this._slicers = [];

        this.recovering = false;
        this.ready = false;
        this.stopped = false;
        this.tasks = new PQueue();
        this.queue = new Queue();
        this._processSlicers = this._processSlicers.bind(this);
    }

    run() {
        this.logger.debug('running the scheduler');

        const done = () => this.stopped || this.isFinished;

        this.tasks.start();
        return pWhilst(() => !done(), this._processSlicers);
    }

    get isFinished() {
        if (!this.ready) return false;

        const tasksDone = this.tasks.pending === 0 && this.tasks.size === 0;
        return this.slicersDone && this.queue.size() === 0 && tasksDone;
    }

    // this is used to determine when the slices are done
    get isOnce() {
        const { lifecycle } = this.executionContext.config;
        return (lifecycle === 'once') && !this.recovering;
    }

    registerSlicers(slicerFns, recovering = false) {
        const { config } = this.executionContext;
        if (!_.isArray(slicerFns)) {
            throw new Error(`newSlicer from module ${config.operations[0]._op} needs to return an array of slicers`);
        }

        this.recovering = recovering;

        _.forEach(slicerFns, (slicerFn) => {
            this._registerSlicer(slicerFn);
        });

        this.logger.debug(`registered ${_.size(slicerFns)} slicers`);
        this.events.emit('analytics:slicers', this._slicers.length);
        this.ready = true;
    }

    pause() {
        return this.tasks.pause();
    }

    resume() {
        return this.tasks.start();
    }

    stop() {
        this.stopped = true;
    }

    getSlice() {
        const slice = this.queue.dequeue();
        if (slice) {
            this.events.emit('analytics:queued', this.queueLength);
        }
        return slice;
    }

    enqueueSlice(slice, addToStart = false) {
        if (this.queue.exists('slice_id', slice.slice_id)) {
            this.logger.warn(`slice ${slice.slice_id} has already been enqueued`);
            return;
        }

        this.logger.debug('enqueuing slice', slice);
        this.events.emit('analytics:queued', this.queueLength);
        if (addToStart) {
            this.queue.unshift(slice);
        } else {
            this.queue.enqueue(slice);
        }
    }

    get queueLength() {
        return this.queue.size();
    }

    cleanup() {
        this._slicers.length = 0;
        this.tasks.clear();
        this.queue.each((slice) => {
            this.queue.remove(slice.slice_id, 'slice_id');
        });
    }

    _processSlicers() {
        if (this.tasks.isPaused) return Promise.delay(100);
        const estimatedSize = this.queueLength + this.tasks.size;
        if (estimatedSize >= this.executionContext.queueLength) return Promise.delay(0);
        let done = 0;

        _.forEach(this._slicers, (slicer) => {
            if (slicer.isProcessing()) return;
            if (slicer.isDone()) {
                done += 1;
                return;
            }

            this.tasks.add(() => slicer.slice());
        });

        if (done === _.size(this._slicers)) {
            this.logger.info(`all slicers for execution: ${this.exId} have been completed, waiting for slices in slicerQueue to be processed`);
            this.events.emit('slicers:finished');
            this.slicersDone = true;
            return this.tasks.onIdle();
        }

        return Promise.delay(0);
    }

    _registerSlicer(slicerFn) {
        const slicerId = this._slicers.length;
        let slicerOrder = 0;
        let done = false;
        let processing = false;

        this._slicers.push({
            isDone: () => done,
            isProcessing: () => processing,
            slice: async () => {
                processing = true;
                this.logger.trace(`slicer ${slicerId} is being called`);
                try {
                    const sliceRequest = await slicerFn();
                    this.logger.trace(`slicer ${slicerId} was called`, { sliceRequest });

                    // not null or undefined
                    if (sliceRequest != null) {
                        if (_.isArray(sliceRequest)) {
                            this.events.emit('analytics:subslice');
                        }

                        const slices = this._createSlices(sliceRequest, slicerId, slicerOrder);
                        slicerOrder += slices.length;
                    } else if (this.isOnce) {
                        done = true;
                        this.logger.trace(`slicer ${slicerId} finished`);
                        this.logger.info(`a slicer for execution: ${this.exId} has completed its range`);
                        // slicer => a single slicer has finished
                        this.events.emit('slicer:finished');
                    }
                } catch (err) {
                    this.events.emit('slicer:failure', err);
                } finally {
                    processing = false;
                }
            }
        });
    }

    _createSlices(request, slicerId, startingOrder) {
        let slicerOrder = startingOrder;

        return _.map(_.castArray(request), (sliceRequest) => {
            slicerOrder += 1;
            let slice = sliceRequest;

            // recovery slices already have correct meta data
            if (!slice.slice_id) {
                slice = {
                    slice_id: uuidv4(),
                    request: sliceRequest,
                    slicer_id: slicerId,
                    slicer_order: slicerOrder,
                };
            }
            this.enqueueSlice(slice);
        });
    }
}

module.exports = Scheduler;
