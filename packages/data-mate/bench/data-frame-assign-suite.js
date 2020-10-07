'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/people');
const { DataFrame } = require('../dist/src');

const run = async () => {
    const suite = Suite('DataFrame->assign');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('Add column', {
        fn() {
            dataFrame.assign(dataFrame.columns[0].rename('new_column'));
        }
    });

    suite.add('Replace column', {
        fn() {
            dataFrame.assign(dataFrame.columns[0].fork());
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
