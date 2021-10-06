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

    suite.add('using query: "birthday:>=\\"1990-01-04T00:00:00.000Z\\" AND alive:true"', {
        fn() {
            dataFrame.search('birthday:>="1990-01-04T00:00:00.000Z" AND alive:true');
        }
    });

    suite.add('using query: "ip:\\"192.198.0.0/24\\"', {
        fn() {
            dataFrame.search('ip:"192.198.0.0/24"');
        }
    });

    suite.add('using query: "location:geoDistance(point: "33, 26", distance:1000mi)"', {
        fn() {
            dataFrame.search('location:geoDistance(point: "33, 26", distance:1000mi)');
        }
    });

    suite.add('using query: "metadata.number_of_friends:>5"', {
        fn() {
            dataFrame.search('metadata.number_of_friends:>5');
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
