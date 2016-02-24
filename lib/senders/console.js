'use strict';


function newSender() {
    return function(data) {
        console.log(data);
    }
}

function schema() {
    return {}
}

module.exports = {
    newSender: newSender,
    schema: schema
};

