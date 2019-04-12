'use strict';

class FakeDataEntity {
    constructor(d, m) {
        this.metadata = Object.assign({}, m, { createdAt: Date.now() });

        Object.assign(this, d);
    }

    getMetadata(key) {
        return this.metadata[key];
    }

    setMetadata(key, val) {
        this.metadata[key] = val;
    }
}

module.exports = FakeDataEntity;
