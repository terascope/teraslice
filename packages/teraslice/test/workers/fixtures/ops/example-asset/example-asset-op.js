'use strict';

function newProcessor() {
    return (data) => data.map(() => 'hello');
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
    newProcessor,
    schema,
};
