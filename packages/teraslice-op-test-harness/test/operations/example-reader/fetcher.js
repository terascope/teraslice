'use strict';

const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    async initialize() {
        this.initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    async fetch() {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            });
        }
        return result;
    }
}

module.exports = ExampleFetcher;
