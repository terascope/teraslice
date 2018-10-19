'use strict';

const { Fetcher, DataEntity } = require('../../dist');

class SimpleFetcher extends Fetcher {
    async fetch({ count = 10000, precreate }) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const data = {
                id: `${i}-${Math.random()}`,
                filterMe: i % 10 === 0,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            };
            if (precreate) {
                result.push(DataEntity.make(data));
            } else {
                result.push(data);
            }
        }
        return result;
    }
}

module.exports = SimpleFetcher;
