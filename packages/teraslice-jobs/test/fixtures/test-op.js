'use strict';

function schema() {
    return {
        hello: {
            doc: 'Example prop',
            default: true,
            format: 'Boolean'
        },
    };
}

function newProcessor() {
    return data => data;
}

module.exports = {
    schema,
    newProcessor,
};
