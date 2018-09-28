'use strict';

const Promise = require('bluebird');
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

        const sendAnalytics = async () => {
            if (!this.sendingAnalytics) return;
            await Promise.delay(this.analyticsRate);
            await this._pushAnalytics();
        };

        sendAnalytics();
    }

    set(key, value) {
        _.update(this.executionAnalytics, key, (c) => {
            if (_.isFinite(c) && !_.isFinite(value)) {
                this.logger.warn(`cannot set ${key} because to "${value}" it is not a valid number`);
                return c;
            }
            return value;
        });
    }

    increment(key) {
        _.update(this.executionAnalytics, key, (c) => {
            if (!_.isFinite(c)) {
                this.logger.warn(`cannot increment ${key} because it is not a valid number`);
                return c;
            }
            return c + 1;
        });
    }

    get() {
        return this.executionAnalytics;
    }

    getAnalytics() {
        return _.cloneDeep(this.executionAnalytics);
    }

    async shutdown(timeout) {
        this.sendingAnalytics = false;

        _.forEach(this._handlers, (handler, event) => {
            this.events.removeListener(event, handler);
        });

        await this._pushAnalytics(timeout);
    }

    async _pushAnalytics(timeout = Math.round(this.analyticsRate / 2)) {
        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};
        _.forOwn(this.pushedAnalytics, (value, field) => {
            diffs[field] = _.get(this.executionAnalytics, field) - value;
            copy[field] = _.get(this.executionAnalytics, field);
        });

        await this.client.sendClusterAnalytics(diffs, timeout);

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

        this._handlers['analytics:subslice'] = () => {
            this.logger.warn(`slicer for execution: ${exId} is subslicing by key`);
            this.increment('subslice_by_key');
        };

        this._handlers['analytics:queued'] = (queueSize) => {
            this.set('queued', queueSize);
        };

        this._handlers['analytics:slicers'] = (count) => {
            this.set('slicers', count);
        };

        this._handlers['slice:success'] = (count) => {
            this.increment('processed', count);
        };

        this._handlers['slice:failure'] = (count) => {
            this.increment('processed', count);
            this.increment('failed', count);
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
