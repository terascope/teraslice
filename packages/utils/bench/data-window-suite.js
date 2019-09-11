'use strict';

/* eslint-disable no-unused-expressions */

const { Suite } = require('./helpers');
const FakeDataWindow = require('./fixtures/fake-data-window');
const {
    DataEntity,
    DataWindow,
    times,
    fastCloneDeep
} = require('../dist/src');

function makeObj(i) {
    return {
        [`str-${i}`]: `data-${i}`,
        [`int-${i}`]: i * Math.random(),
        [`obj-${i}`]: {
            a: Math.random(),
            b: Math.random(),
            c: Math.random(),
        },
    };
}
const arr = times(100, makeObj);

const metadata = { _key: Math.random() * 1000 * 1000 };

const run = async () => Suite('DataWindow')
    .add('new array', {
        fn() {
            const input = fastCloneDeep(arr);
            let window = DataEntity.makeArray(input.slice());
            window.metadata = Object.assign({}, metadata, { _createTime: Date.now() });
            window.push(
                DataEntity.make(makeObj(window.length + 1))
            );
            window.unshift(
                DataEntity.make(makeObj(-1))
            );
            window.length = 0;
            window = null;
            return window;
        }
    })
    .add('new FakeDataWindow', {
        fn() {
            const input = fastCloneDeep(arr);
            let window = new FakeDataWindow(input, metadata);
            window.push(
                DataEntity.make(makeObj(window.length + 1))
            );
            window.unshift(
                DataEntity.make(makeObj(-1))
            );
            window.length = 0;
            window = null;
            return window;
        }
    })
    .add('new DataWindow', {
        fn() {
            const input = fastCloneDeep(arr);
            let window = new DataWindow(input, metadata);
            window.push(
                DataEntity.make(makeObj(window.length + 1))
            );
            window.unshift(
                DataEntity.make(makeObj(-1))
            );
            window.length = 0;
            window = null;
            return window;
        }
    })
    .add('DataWindow.make', {
        fn() {
            const input = fastCloneDeep(arr);
            let window = DataWindow.make(input, metadata);
            window.push(
                DataEntity.make(makeObj(window.length + 1))
            );
            window.unshift(
                DataEntity.make(makeObj(-1))
            );
            window.length = 0;
            window = null;
            return window;
        }
    })
    .run({
        async: true,
        initCount: 1,
        maxTime: 5
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
