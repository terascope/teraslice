'use strict';


function newProcessor() {
    throw new Error('Bad news bears');
}

function schema() {
    return {};
}


module.exports = {
    newProcessor,
    schema
};
