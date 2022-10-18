'use strict';

const { Fetcher, DataEntity } = require('../../../dist/src/index.js');

class SimpleFetcher extends Fetcher {
    async fetch({ count = 1000, precreate, addMetadata } = {}) {
        const result = [];
        for (let i = 0; i < count; i++) {
            const data = {
                id: `${i}-${Math.random()}`,
                filterMe: i % 10 === 0,
                data: [Math.random(), Math.random(), Math.random()]
            };

            // used when no data entity is created
            // in order to keep it as close to possible
            if (addMetadata) {
                data.metadata = { _createTime: Date.now() };
            }

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
