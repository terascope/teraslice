'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src/index.js');

const run = async () => {
    const suite = Suite('DataFrame->countEmptyRows');

    let dataFrame = DataFrame.fromJSON(config, data);
    dataFrame = dataFrame.appendAll([dataFrame, dataFrame, dataFrame, dataFrame, dataFrame]);

    // select fields that use randNull, see generate-data.js
    const dataFrameWithEmptyRows = dataFrame.select('favorite_animal', 'ip', 'address');
    suite.add('with empty rows', {
        fn() {
            dataFrameWithEmptyRows.countEmptyRows();
        }
    });

    // Don't select fields that use randNull, see generate-data.js
    // and select the same number of fields as the one above
    const dataFrameWithoutEmptyRows = dataFrame.select('name', 'birthday', 'phones');
    suite.add('with no empty rows', {
        fn() {
            dataFrameWithoutEmptyRows.countEmptyRows();
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
