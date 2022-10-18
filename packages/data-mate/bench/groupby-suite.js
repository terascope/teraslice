'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src/index.js');

const run = async () => {
    const suite = Suite('Group By');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(`(${column.vector.countUnique()} distinct) ${fieldInfo}`, {
            defer: true,
            fn(deferred) {
                dataFrame
                    .aggregate()
                    .groupBy(column.name)
                    .run()
                    .then(() => deferred.resolve(), deferred.reject);
            }
        });
    }

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
