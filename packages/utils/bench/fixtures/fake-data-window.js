'use strict';

const { DataEntity } = require('../../dist/src');

class FakeDataWindow extends Array {
    constructor(d, m) {
        if (Array.isArray(d)) {
            super(...DataEntity.makeArray(d));
        } else {
            super();
        }
        this.metadata = Object.assign({}, m, { _createTime: Date.now() });
    }

    getMetadata(key) {
        return this.metadata[key];
    }

    setMetadata(key, val) {
        this.metadata[key] = val;
    }
}

module.exports = FakeDataWindow;
