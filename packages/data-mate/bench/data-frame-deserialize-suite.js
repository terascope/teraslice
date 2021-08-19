'use strict';

const { timesIter } = require('@terascope/utils');
const fs = require('fs');
const path = require('path');
const { Suite } = require('./helpers');
const { DataFrame } = require('./src');

const _dfJSON = fs.readFileSync(path.join(__dirname, './fixtures/data.dfjson'));

const run = async () => {
    const suite = Suite('DataFrame#deserialize');
    let df = await DataFrame.deserialize(_dfJSON);
    df = df.appendAll(timesIter(10, () => df));
    const dfJSONStr = df.serialize();

    suite.add('with string', {
        defer: true,
        fn(deferred) {
            DataFrame.deserialize(dfJSONStr)
                .then(
                    () => deferred.resolve(),
                    deferred.reject
                );
        }
    });

    const dfJSONBuffer = Buffer.from(dfJSONStr);
    suite.add('with Buffer', {
        defer: true,
        fn(deferred) {
            DataFrame.deserialize(dfJSONBuffer)
                .then(
                    () => deferred.resolve(),
                    deferred.reject
                );
        }
    });

    return suite.run({
        async: true,
        initCount: 4,
        minSamples: 2,
        maxTime: 30,
    });
};
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
