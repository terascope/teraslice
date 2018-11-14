'use strict';

const { Suite } = require('./helpers');
const FakeDataEntity = require('./fixtures/fake-data-entity');
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

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {
            console.log('DONE!'); // eslint-disable-line
        });
    });
} else {
    module.exports = run;
}
