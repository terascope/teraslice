'use strict';

/* eslint-disable no-unused-expressions */

const { Suite } = require('./helpers');
const FakeDataEntity = require('./fixtures/fake-data-entity');
const makeProxyEntity = require('./fixtures/proxy-entity');
const { DataEntity } = require('../dist');

const data = {
    id: Math.random(),
    hello: 'sir',
    hi: 'dude',
    howdy: 'there'
};

const metadata = { id: Math.random() * 1000 };

const run = async () => Suite('DataEntity (small records)')
    .add('new data', {
        fn() {
            let entity = Object.assign({}, data);
            entity.metadata = Object.assign({ createdAt: Date.now() });
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
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
    .add('new FakeDataEntity', {
        fn() {
            let entity = new FakeDataEntity(data);
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
    .add('new DataEntity', {
        fn() {
            let entity = new DataEntity(data);
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
    .add('DataEntity.make', {
        fn() {
            let entity = DataEntity.make(data);
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
    .add('new proxy entity', {
        fn() {
            let entity = makeProxyEntity(data);
            entity.hello = Math.random();
            entity.hello;
            entity = null;
            return entity;
        }
    })
    .add('new proxy entity with metadata', {
        fn() {
            let entity = makeProxyEntity(data, metadata);
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
