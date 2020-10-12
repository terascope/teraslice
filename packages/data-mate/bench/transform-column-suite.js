'use strict';

const { Suite } = require('./helpers');
const { config, data } = require('./fixtures/data.json');
const { DataFrame, ColumnTransform } = require('./src');

const run = async () => {
    const suite = Suite('Transform Column');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        Object.entries(ColumnTransform)
            .filter(([, transform]) => {
                if (!transform.accepts || !transform.accepts.length) return false;
                if (!transform.accepts.includes(column.vector.type)) return false;
                if (transform.required_args && transform.required_args.length) return false;
                return true;
            })
            .forEach(([name, transform]) => {
                suite.add(`${fieldInfo} ${name}`, {
                    fn() {
                        column.transform(transform);
                    }
                });
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
