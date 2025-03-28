import { getGroupedFields } from '@terascope/data-types';
import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { Column } from '../dist/src/index.js';

const { config, data } = json;

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

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
