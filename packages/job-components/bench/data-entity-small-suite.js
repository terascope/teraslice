'use strict';

const { Suite } = require('./helpers');
const FakeDataEntity = require('./fixtures/fake-data-entity');
const { DataEntity } = require('../dist');

const data = { hello: true };
const metadata = { id: 1 };

module.exports = () => Suite('DataEntity (small records)')
    .add('new data', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = { createdAt: Date.now() };
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
    .run({
        async: true,
        initCount: 2,
        maxTime: 10,
    });
