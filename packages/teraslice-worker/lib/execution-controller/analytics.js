'use strict';

const _ = require('lodash');
const { newFormatedDate } = require('../teraslice');
const { makeLogger } = require('../utils/context');

class ExecutionAnalytics {
    constructor(context, executionContext, clusterMasterClient) {
        this.logger = makeLogger(context, executionContext, 'execution_analytics');
        this.events = context.apis.foundation.getSystemEvents();
        this.executionContext = executionContext;
        this.clusterMasterClient = clusterMasterClient;
        this.analyticsRate = _.get(context, 'sysconfig.teraslice.analytics_rate');
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
            started: newFormatedDate(),
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

        this.events.on('slicer:slice:recursion', () => {
            this.logger.trace('id subslicing has occurred');
            this.executionAnalytics.subslices += 1;
        });

        this.events.on('slicer:slice:range_expansion', () => {
            this.logger.trace('a slice range expansion has occurred');
            this.executionAnalytics.slice_range_expansion += 1;
        });

        this.clusterMasterClient.on('cluster:slicer:analytics', (msg) => {
            this.clusterMasterClient.respond(msg, {
                node_id: msg.node_id,
                job_id: jobId,
                ex_id: exId,
                payload: {
                    name,
                    stats: this.executionAnalytics
                }
            });
        });

        this.analyticsTimer = setInterval(() => {
            this._pushAnalytics();
        }, this.analyticsRate);
    }

    set(key, value) {
        this.executionAnalytics[key] = value;
    }

    increment(key) {
        this.executionAnalytics[key] += 1;
    }

    get() {
        return this.executionAnalytics;
    }

    getAnalytics() {
        return _.cloneDeep(this.executionAnalytics);
    }

    async shutdown() {
        clearInterval(this.analyticsTimer);

        await this._pushAnalytics();
    }

    async _pushAnalytics() {
        // save a copy of what we push so we can emit diffs
        const diffs = {};
        const copy = {};
        _.forOwn(this.pushedAnalytics, (value, field) => {
            diffs[field] = this.executionAnalytics[field] - value;
            copy[field] = this.executionAnalytics[field];
        });

        await this.clusterMasterClient.updateAnalytics(diffs);

        this.pushedAnalytics = copy;
    }
}

module.exports = ExecutionAnalytics;
