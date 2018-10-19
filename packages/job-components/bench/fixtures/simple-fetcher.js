'use strict';

const { Fetcher } = require('../../dist');

class SimpleFetcher extends Fetcher {
    async fetch(count = 10000) {
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push({
                id: `${i}-${Math.random()}`,
                filterMe: i % 10 === 0,
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

module.exports = SimpleFetcher;
