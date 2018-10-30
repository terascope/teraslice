'use strict';

const _ = require('lodash');
const autoBind = require('auto-bind');
const Promise = require('bluebird');
const Client = require('./client');
const Job = require('./job');

class Jobs extends Client {
    constructor(config) {
        super(config);
        this._config = config;
        autoBind(this);
    }

    submit(jobSpec, shouldNotStart) {
        if (!jobSpec) {
            return Promise.reject(new Error('submit requires a jobSpec'));
        }

        const options = {
            json: jobSpec,
            qs: { start: !shouldNotStart }
        };

        return this.post('/jobs', options)
            .then(result => this.wrap(result.job_id));
    }

    list(options) {
        const qs = _parseListOptions(options);
        return this.get('/ex', { qs });
    }

    jobs(options) {
        const qs = _parseListOptions(options);
        return this.get('/jobs', { qs });
    }

    // Wraps the job_id with convenience functions for accessing
    // the state on the server.
    wrap(jobId) {
        return new Job(this._config, jobId);
    }
}

function _parseListOptions(options) {
    // support legacy
    if (!options) return { status: '*' };
    if (_.isString(options)) return { status: options };
    return options;
}

module.exports = Jobs;
