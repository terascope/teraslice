'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src/index.js');

const run = async () => {
    const suite = Suite('DataFrame->assign');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('Add column', {
        fn() {
            dataFrame.assign([
                dataFrame.columns[0].rename('new_column')
            ]);
        }
    });

    const newColumn = dataFrame.columns[0].fork(dataFrame.columns[0].vector);
    suite.add('Replace column', {
        fn() {
            dataFrame.assign([
                newColumn
            ]);
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
