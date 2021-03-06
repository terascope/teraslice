'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src');

const run = async () => {
    const suite = Suite('DataFrame->limit');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('limit 10', {
        fn() {
            dataFrame.limit(10);
        }
    });

    suite.add('limit 100', {
        fn() {
            dataFrame.limit(100);
        }
    });

    return suite.run({
        async: true,
        initCount: 2,
        minSamples: 2,
        maxTime: 20,
    });
};
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
