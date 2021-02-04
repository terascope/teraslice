'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src');

const run = async () => {
    const suite = Suite('Search');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('using query: "age:<20"', {
        fn() {
            dataFrame.search('age:<20');
        }
    });

    suite.add('using query: "age:>80 AND alive:false"', {
        fn() {
            dataFrame.search('age:>80 AND alive:false');
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
