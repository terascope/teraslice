import { getGroupedFields } from '@terascope/data-types';
import { Suite } from './helpers.js';
import { config, data } from './fixtures/data.json';
import { Column } from '../dist/src/index.js';

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
