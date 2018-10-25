'use strict';

const { Suite } = require('./helpers');
const { DataEntity } = require('../dist');

const data = {};

for (let i = 0; i < 100; i++) {
    data[`str-${i}`] = `data-${i}`;
    data[`int-${i}`] = i;
}

const metadata = { id: Math.random() * 1000 * 1000 };

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

module.exports = () => Suite('DataEntity (large records)')
    .add('new data', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = { createdAt: new Date() };
            entity = null;
            return entity;
        }
    })
    .add('new data with metadata', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = Object.assign({}, metadata, { createdAt: new Date() });
            entity = null;
            return entity;
        }
    })
    .add('new FakeDataEntity', {
        fn() {
            let entity = new FakeDataEntity(data);
            entity = null;
            return entity;
        }
    })
    .add('new FakeDataEntity metadata', {
        fn() {
            let entity = new FakeDataEntity(data, metadata);
            entity = null;
            return entity;
        }
    })
    .add('new DataEntity', {
        fn() {
            let entity = new DataEntity(data);
            entity = null;
            return entity;
        }
    })
    .add('new DataEntity with metadata', {
        fn() {
            let entity = new DataEntity(data, metadata);
            entity = null;
            return entity;
        }
    })
    .run({ async: true });
