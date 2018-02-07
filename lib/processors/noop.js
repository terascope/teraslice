'use strict';


function newProcessor(context, opConfig, executionConfig) {
    return data => data;
}

function schema() {
    return {};
}


module.exports = {
    newProcessor,
    schema
};
