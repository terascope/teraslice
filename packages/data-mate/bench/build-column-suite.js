'use strict';

const { getGroupedFields } = require('@terascope/data-types');
const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/people');
const { Column } = require('../dist/src');

const run = async () => {
    const suite = Suite('Build Column');

    for (const name of Object.keys(getGroupedFields(config.fields))) {
        const fieldConfig = config.fields[name];
        const values = data.map((row) => row[name]);
        const fieldInfo = `${name} (${fieldConfig.type}${fieldConfig.array ? '[]' : ''})`;
        suite.add(fieldInfo, {
            fn() {
                Column.fromJSON(name, fieldConfig, values);
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
