'use strict';
/*
    This sender does nothing. Useful for testing and some processing work loads.
*/
function newProcessor() {
    return function(data) {
        return data.length;
    }
}

function schema() {
    return {}
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};

