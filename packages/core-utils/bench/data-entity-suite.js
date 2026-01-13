import { Suite } from './helpers.js';
import FakeDataEntity from './fixtures/fake-data-entity.js';
import {
    DataEntity, times, fastCloneDeep, isExecutedFile
} from '../dist/src/index.js';

const data = {};

for (let i = 0; i < 50; i++) {
    data[`str-${i}`] = `data-${i}`;
    data[`int-${i}`] = i;
    data[`obj-${i}`] = {
        a: Math.random(),
        b: Math.random(),
        c: Math.random(),
        d: Math.random(),
        e: Math.random(),
        f: Math.random()
    };
}

data['big-array'] = times(50, (n) => `item-${n}`);

const metadata = { id: Math.random() * 1000 * 1000 };

const run = async () => Suite('DataEntity')
    .add('new data', {
        fn() {
            const input = fastCloneDeep(data);
            let entity = Object.assign({}, input);
            entity.metadata = Object.assign({}, metadata, { _createTime: Date.now() });
            entity.hello = Math.random();
            entity = null;
            return entity;
        }
    })
    .add('new FakeDataEntity', {
        fn() {
            const input = fastCloneDeep(data);
            let entity = new FakeDataEntity(input, metadata);
            entity.hello = Math.random();
            entity = null;
            return entity;
        }
    })
    .add('new DataEntity', {
        fn() {
            const input = fastCloneDeep(data);
            let entity = new DataEntity(input, metadata);
            entity.hello = Math.random();
            entity = null;
            return entity;
        }
    })
    .add('DataEntity.make', {
        fn() {
            const input = fastCloneDeep(data);
            let entity = DataEntity.make(input, metadata);
            entity.hello = Math.random();
            entity = null;
            return entity;
        }
    })
    .run({
        async: true,
        initCount: 1,
        maxTime: 5
    });

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
