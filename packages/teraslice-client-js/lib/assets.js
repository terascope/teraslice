'use strict';

const path = require('path');
const _ = require('lodash');
const autoBind = require('auto-bind');
const Promise = require('bluebird');
const Client = require('./client');

class Assets extends Client {
    constructor(config) {
        super(config);
        autoBind(this);
    }

    post(stream, parseResponse) {
        if (_.isEmpty(stream)) {
            return Promise.reject(new Error('Asset stream must not be empty'));
        }

        return super.post('/assets', stream).then((response) => {
            if (!parseResponse) return response;

            return JSON.parse(response);
        });
    }

    delete(id, parseResponse) {
        if (_.isEmpty(id)) {
            return Promise.reject(new Error('Asset delete requires a ID'));
        }

        return super.delete(`/assets/${id}`, { json: false }).then((response) => {
            if (!parseResponse) return response;

            return JSON.parse(response);
        });
    }

    list() {
        return super.get('/assets');
    }

    get(assetPath) {
        const pathing = path.join('/assets', assetPath);
        return super.get(pathing);
    }
}

module.exports = Assets;
