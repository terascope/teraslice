'use strict';

const { Suite } = require('./helpers');
const { DataEntity } = require('../dist');

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
        maxTime: 3,
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
