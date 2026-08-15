import fs from 'node:fs';
import path from 'node:path';
import { FieldType } from '@terascope/types';
import { isExecutedFile } from '@terascope/core-utils';
import { Suite } from './helpers.js';
import {
    DataFrame, isNumberLike, ValueAggregation,
    KeyAggregation
} from '../dist/src/index.js';

const json = fs.readFileSync(path.join('.', './fixtures/data.json'));
const { config, data } = JSON.parse(json);

const run = async () => {
    const suite = Suite('Aggregate');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        if (isNumberLike(column.config.type)) {
            for (const agg of Object.values(ValueAggregation)) {
                const aggregateFrame = dataFrame.select(column.name).aggregate();

                suite.add(`${agg} ${fieldInfo}`, {
                    defer: true,
                    fn(deferred) {
                        aggregateFrame[agg](column.name)
                            .run()
                            .then(() => deferred.resolve(), deferred.reject);
                    }
                });
            }
        } else if (column.config.type === FieldType.Date) {
            for (const agg of Object.values(KeyAggregation)) {
                const aggregateFrame = dataFrame.select(column.name).aggregate();

                suite.add(`${agg} ${fieldInfo}`, {
                    defer: true,
                    fn(deferred) {
                        aggregateFrame[agg](column.name)
                            .run()
                            .then(() => deferred.resolve(), deferred.reject);
                    }
                });
            }
        }
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
