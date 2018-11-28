'use strict';

const { Fetcher, DataEntity } = require('../../..');

class FailingFetcher extends Fetcher {
    async fetch() {
        return [
            DataEntity.fromBuffer(JSON.stringify({ hello: true }), this.opConfig),
            DataEntity.fromBuffer(JSON.stringify({ hi: true }), this.opConfig),
            DataEntity.fromBuffer('{"thiswill":fail}', this.opConfig),
        ];
    }
}

module.exports = FailingFetcher;
