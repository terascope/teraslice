'use strict';

const _ = require('lodash');
const autoBind = require('auto-bind');
const Client = require('./client');

class Ex extends Client {
    constructor(config) {
        super(config);
        this._config = config;
        autoBind(this);
    }

    stop(exId, qs) {
        _checkID(exId);
        return this.post(`/ex/${exId}/_stop`, { qs });
    }

    pause(exId, qs) {
        _checkID(exId);
        return this.post(`/ex/${exId}/_pause`, { qs });
    }

    resume(exId, qs) {
        _checkID(exId);
        return this.post(`/ex/${exId}/_resume`, { qs });
    }

    status(exId) {
        _checkID(exId);
        return this.get(`/ex/${exId}`)
            .then(exSpec => exSpec._status);
    }

    list(options) {
        const qs = _parseListOptions(options);
        return this.get('/ex', { qs });
    }
}
function _checkID(exId) {
    if (!exId) {
        throw new Error('Ex requires exId');
    }
    if (!_.isString(exId)) {
        throw new Error('Ex requires exId to be a string');
    }
}

function _parseListOptions(options) {
    // support legacy
    if (!options) return { status: '*' };
    if (_.isString(options)) return { status: options };
    return options;
}

module.exports = Ex;
