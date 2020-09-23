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
            format: 'nat'
        }
    };
}

module.exports = {
    newSlicer,
    newReader,
    schema,
};
