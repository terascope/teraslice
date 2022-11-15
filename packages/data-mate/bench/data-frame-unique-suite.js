'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame } = require('./src/index.js');

const run = async () => {
    const suite = Suite('DataFrame->unique');

    const dataFrame = DataFrame.fromJSON(config, data);
    const names = dataFrame.columns.map((col) => col.name);

    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(fieldInfo, {
            fn() {
                dataFrame.unique(column.name);
            }
        });
    }

    const multiFields = names.slice(0, 3);
    suite.add(`Multiple Fields: ${multiFields.join(', ')}`, {
        fn() {
            dataFrame.unique(multiFields);
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
