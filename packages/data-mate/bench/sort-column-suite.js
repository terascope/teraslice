'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/people');
const { DataFrame } = require('../dist/src');

const run = async () => {
    const suite = Suite('Sort Column (via DataFrame.orderBy)');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(`(${column.vector.distinct()} distinct) ${fieldInfo}`, {
            fn() {
                dataFrame.orderBy(column.name);
            }
        });
    }

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
