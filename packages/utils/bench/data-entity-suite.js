'use strict';

/* eslint-disable no-unused-expressions */

const { times } = require('@terascope/utils');
const { Suite } = require('./helpers');
const FakeDataEntity = require('./fixtures/fake-data-entity');
const { DataEntity } = require('../dist/src');

const data = {};

for (let i = 0; i < 100; i++) {
    data[`str-${i}`] = `data-${i}`;
    data[`int-${i}`] = i;
    data[`obj-${i}`] = {
        a: Math.random(),
        b: Math.random(),
        c: Math.random(),
        d: Math.random(),
        e: Math.random(),
        f: Math.random(),
    };
}

data['big-array'] = times(100, n => `item-${n}`);

const metadata = { id: Math.random() * 1000 * 1000 };

const run = async () => Suite('DataEntity')
    .add('new data with metadata', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = Object.assign({}, metadata, { createdAt: Date.now() });
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
    .add('new FakeDataEntity metadata', {
        fn() {
            let entity = new FakeDataEntity(data, metadata);
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
    .add('new DataEntity with metadata', {
        fn() {
            let entity = new DataEntity(data, metadata);
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
    .add('DataEntity.make with metadata', {
        fn() {
            let entity = DataEntity.make(data, metadata);
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
    .run({
        async: true,
        initCount: 1,
        maxTime: 3,
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
