import { Suite } from './helpers.js';
import { DataEntity, isExecutedFile } from '../dist/src/index.js';

const data = JSON.stringify({
    id: Math.random(),
    hello: 'sir',
    hi: 'dude',
    howdy: 'there'
});

const dataBuf = Buffer.from(data);

const run = async () => Suite('DataEncoding')
    .add('without DataEntities', {
        fn() {
            const obj = JSON.parse(dataBuf);
            Buffer.from(JSON.stringify(Object.assign({}, obj)));
        }
    })
    .add('with DataEntities', {
        fn() {
            const dataEntity = DataEntity.fromBuffer(dataBuf);
            dataEntity.toBuffer();
        }
    })
    .run({
        async: true,
        initCount: 1,
        maxTime: 5,
    });

export default run;

if (isExecutedFile()) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
