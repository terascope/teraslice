'use strict';

class FakeDataEntity {
    constructor(d, m) {
        if (m) {
            this.metadata = Object.assign({}, m, { createdAt: new Date() });
        } else {
            this.metadata = { createdAt: new Date() };
        }

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
