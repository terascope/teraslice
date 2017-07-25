'use strict';


function newProcessor(context, opConfig, jobConfig) {
    return function(data) {
        return data;
    };
}

function schema() {
    return {
    };
};


module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
