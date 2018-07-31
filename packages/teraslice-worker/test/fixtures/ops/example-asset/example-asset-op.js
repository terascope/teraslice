'use strict';

function newProcessor() {
    return data => data.map(() => 'hello');
}

function schema() {
    return {
        exampleProp: {
            doc: 'Specify some example configuration',
            default: 0,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('example-asset-op exampleProp must be a number.');
                } else if (val < 0) {
                    throw new Error('example-asset-op exampleProp must be a number greater than or equal to 0.');
                }
            }
        }
    };
}

module.exports = {
    newProcessor,
    schema,
};
