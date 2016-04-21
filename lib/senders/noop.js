'use strict';
/*
    This sender does nothing. Useful for testing and some processing work loads.
*/
function newSender() {
    return function(data) {
        return data.length;
    }
}

function schema() {
    return {}
}

module.exports = {
    newSender: newSender,
    schema: schema
};

