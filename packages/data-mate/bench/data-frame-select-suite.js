'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/people');
const { DataFrame } = require('../dist/src');

const run = async () => {
    const suite = Suite('DataFrame->assign');

    const dataFrame = DataFrame.fromJSON(config, data);
    const names = dataFrame.columns.map((col) => col.name);
    suite.add('Select one', {
        fn() {
            dataFrame.assign(...names.slice(0, 1));
        }
    });

    suite.add('Select multiple', {
        fn() {
            dataFrame.select(...names.slice(0, 3));
        }
    });

    return suite.run({
        async: true,
        initCount: 2,
        minSamples: 3,
        maxTime: 15,
    });
};
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
