'use strict';

const { Fetcher } = require('@terascope/job-components');

class ExampleFetcher extends Fetcher {
    async fetch() {
        const { countPerFetch } = this.opConfig;

        const result = [];

        for (let i = 0; i < countPerFetch; i++) {
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
