'use strict';

function newReader() {
    return () => Array(100).fill('howdy');
}

function newSlicer() {
    return () => Array(100).fill('sliced-data');
}

function schema() {
    return {
        exampleProp: {
            doc: 'Specify some example configuration',
            default: 0,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('example-asset-reader exampleProp must be a number.');
                } else if (val < 0) {
                    throw new Error('example-asset-reader exampleProp must be a number greater than or equal to 0.');
                }
            }
        }
    };
}

module.exports = {
    newSlicer,
    newReader,
    schema,
};
