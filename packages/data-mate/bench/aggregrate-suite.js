'use strict';

const { FieldType } = require('@terascope/types');
const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const {
    DataFrame, isNumberLike, ValueAggregation, KeyAggregation
} = require('./src/index.js');

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
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
