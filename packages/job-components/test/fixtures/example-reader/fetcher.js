'use strict';

const { Fetcher } = require('../../..');

class ExampleFetcher extends Fetcher {
    async fetch() {
        return Array.from(10, n => ({
            id: n,
            data: [
                Math.random(),
                Math.random(),
                Math.random(),
            ]
        }));
    }
}

module.exports = ExampleFetcher;
