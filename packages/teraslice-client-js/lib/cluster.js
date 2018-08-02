'use strict';

const _ = require('lodash');
const autoBind = require('auto-bind');
const Promise = require('bluebird');
const Client = require('./client');

class Cluster extends Client {
    constructor(config) {
        super(config);
        autoBind(this);
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
