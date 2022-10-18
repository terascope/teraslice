'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src/index.js');

const emptyDataFrame = DataFrame.fromJSON(config, []);

const run = async () => Suite('DataFrame Insert')
    .add('DataFrame#fromJSON', {
        fn() {
            DataFrame.fromJSON(config, data);
        }
    })
    .add('DataFrame->concat', {
        fn() {
            emptyDataFrame.concat(data);
        }
    })
    .run({
        async: true,
        initCount: 2,
        minSamples: 5,
        maxTime: 20,
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
