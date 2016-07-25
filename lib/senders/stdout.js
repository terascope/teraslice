'use strict';

function newProcessor() {
    return function(data) {
        console.log(data);
    }
}

function schema() {
    return {}
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};

