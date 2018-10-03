'use strict';

const _ = require('lodash');
const { newFormattedDate } = require('../../utils/date_utils');
const { makeLogger } = require('../helpers/terafoundation');

class ExecutionAnalytics {
    constructor(context, executionContext, client) {
        this.logger = makeLogger(context, executionContext, 'execution_analytics');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.client = client;
        this.analyticsRate = _.get(context, 'sysconfig.teraslice.analytics_rate');
        this._handlers = {};

        this._registerHandlers();
    }

    start() {
        const {
            ex_id: exId,
            job_id: jobId,
        } = this.executionContext;
        const { name } = this.executionContext.job;

        this.executionAnalytics = {
            workers_available: 0,
            workers_active: 0,
            workers_joined: 0,
            workers_reconnected: 0,
            workers_disconnected: 0,
            job_duration: 0,
            failed: 0,
            subslices: 0,
            queued: 0,
            slice_range_expansion: 0,
            processed: 0,
            slicers: 0,
            subslice_by_key: 0,
            started: newFormattedDate(),
        };

        this.pushedAnalytics = {
            processed: 0,
            failed: 0,
            queued: 0,
            job_duration: 0,
            workers_joined: 0,
            workers_disconnected: 0,
            workers_reconnected: 0
        };

        this.client.onExecutionAnalytics(() => ({
            name,
            ex_id: exId,
            job_id: jobId,
            stats: this.executionAnalytics
        }));

        this.sendingAnalytics = true;

        this.intervalId = setInterval(() => {
            if (!this.sendingAnalytics) {
                clearInterval(this.intervalId);
                return;
            }

            this._pushAnalytics();
        }, this.analyticsRate);
    }

    set(key, value) {
        this.executionAnalytics[key] = value;
    }

    increment(key) {
        if (!_.has(this.executionAnalytics, key)) {
            this.logger.warn(`"${key}" is not a valid analytics property`);
            return;
        }

        this.executionAnalytics[key] += 1;
    }

    get() {
        return this.executionAnalytics;
    }

    getAnalytics() {
        return _.cloneDeep(this.executionAnalytics);
    }

    async shutdown(timeout) {
        this.sendingAnalytics = false;
        clearInterval(this.intervalId);

        _.forEach(this._handlers, (handler, event) => {
            this.events.removeListener(event, handler);
        });

        await this._pushAnalytics(timeout);
    }

    async _pushAnalytics(timeout = Math.round(this.analyticsRate / 2)) {
        if (this._pushing) return;
        this._pushing = true;

        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};

        _.forOwn(this.pushedAnalytics, (value, field) => {
            diffs[field] = this.executionAnalytics[field] - value;
            copy[field] = this.executionAnalytics[field];
        });

        const response = await this.client.sendClusterAnalytics(diffs, timeout);
        const recorded = _.get(response, 'payload.recorded', false);

        this._pushing = false;

        if (!recorded && this.sendingAnalytics) {
            this.logger.warn('cluster master did not record the cluster analytics');
            return;
        }

        this.pushedAnalytics = copy;
    }

    _registerHandlers() {
        const { ex_id: exId } = this.executionContext;

        this._handlers['slicer:slice:recursion'] = () => {
            this.logger.trace('id subslicing has occurred');
            this.increment('subslices');
        };

        this._handlers['slicer:slice:range_expansion'] = () => {
            this.logger.trace('a slice range expansion has occurred');
            this.increment('slice_range_expansion');
        };

        this._handlers['slicer:subslice'] = () => {
            this.logger.warn(`slicer for execution: ${exId} is subslicing by key`);
            this.increment('subslice_by_key');
        };

        this._handlers['slicers:queued'] = (queueSize) => {
            this.set('queued', queueSize);
        };

        this._handlers['slicers:registered'] = (count) => {
            this.set('slicers', count);
        };

        this._handlers['slice:success'] = () => {
            this.increment('processed');
        };

        this._handlers['slice:failure'] = () => {
            this.increment('processed');
            this.increment('failed');
        };

        this._handlers['slicers:finished'] = () => {
            this.set('queuing_complete', newFormattedDate());
        };

        _.forEach(this._handlers, (handler, event) => {
            this.events.on(event, handler);
        });
    }
}

module.exports = ExecutionAnalytics;
