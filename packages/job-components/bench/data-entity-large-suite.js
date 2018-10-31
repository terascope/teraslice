'use strict';

const { Suite } = require('./helpers');
const FakeDataEntity = require('./fixtures/fake-data-entity');
const { DataEntity } = require('../dist');

const data = {};

for (let i = 0; i < 100; i++) {
    data[`str-${i}`] = `data-${i}`;
    data[`int-${i}`] = i;
}

const metadata = { id: Math.random() * 1000 * 1000 };

module.exports = () => Suite('DataEntity (large records)')
    .add('new data', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = Object.assign({ createdAt: Date.now() });
            entity = null;
            return entity;
        }
    })
    .add('new data with metadata', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = Object.assign({}, metadata, { createdAt: Date.now() });
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
    .add('DataEntity.make', {
        fn() {
            let entity = DataEntity.make(data);
            entity = null;
            return entity;
        }
    })
    .add('DataEntity.make with metadata', {
        fn() {
            let entity = DataEntity.make(data, metadata);
            entity = null;
            return entity;
        }
    })
    .run({
        async: true,
        initCount: 2,
        maxTime: 5,
    });
