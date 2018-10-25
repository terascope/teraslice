'use strict';

const { Suite } = require('./helpers');
const { DataEntity } = require('../dist');

const data = { hello: true };
const metadata = { id: 1 };

class SimpleWrapper {
    constructor(d, m) {
        this.data = Object.assign({}, d);

        if (m) {
            this.metadata = Object.assign({}, m);
        }
    }
}

module.exports = () => Suite('DataEntity (small records)')
    .add('new data', {
        fn() {
            return Object.assign({}, data);
        }
    })
    .add('new data with metadata', {
        fn() {
            return Object.assign({}, data, { metadata });
        }
    })
    .add('new SimpleWrapper', {
        fn() {
            return new SimpleWrapper(data);
        }
    })
    .add('new SimpleWrapper metadata', {
        fn() {
            return new SimpleWrapper(data, metadata);
        }
    })
    .add('new DataEntity', {
        fn() {
            return new DataEntity(data);
        }
    })
    .add('new DataEntity with metadata', {
        fn() {
            return new DataEntity(data, metadata);
        }
    })
    .run({ async: true });
