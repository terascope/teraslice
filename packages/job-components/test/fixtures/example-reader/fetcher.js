'use strict';

const _ = require('lodash');
const { Fetcher } = require('../../..');

class ExampleFetcher extends Fetcher {
    async fetch() {
        return _.times(10, n => ({
            id: n,
            data: [
                _.random(),
                _.random(),
                _.random(),
            ]
        }));
    }
}

module.exports = ExampleFetcher;
