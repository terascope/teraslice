'use strict';

const _ = require('lodash');
const autoBind = require('auto-bind');
const Promise = require('bluebird');
const util = require('util');
const Client = require('./client');

function _deprecateSlicerName(fn) {
    const msg = 'api endpoints with /slicers are being deprecated in favor of the semantically correct term of /controllers';
    return util.deprecate(fn, msg);
}

class Cluster extends Client {
    constructor(config) {
        super(config);
        this.slicers = _deprecateSlicerName(this.slicers);
        autoBind(this);
    }

    info() {
        return this.get('/');
    }

    state() {
        return this.get('/cluster/state');
    }

    stats() {
        return this.get('/cluster/stats');
    }

    slicers() {
        return this.get('/cluster/slicers');
    }

    controllers() {
        return this.get('/cluster/controllers');
    }

    txt(type) {
        const validTypes = ['assets', 'slicers', 'ex', 'jobs', 'nodes', 'workers'];
        const isValid = _.some(validTypes, validType => _.startsWith(type, validType));
        if (!isValid) {
            const error = new Error(`"${type}" is not a valid type. Must be one of ${JSON.stringify(validTypes)}`);
            return Promise.reject(error);
        }
        return this.get(`/txt/${type}`, { json: false });
    }

    nodes() { // eslint-disable-line
        // not sure why this empty?
    }
}

module.exports = Cluster;
