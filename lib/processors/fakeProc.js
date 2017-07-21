'use strict';


function newProcessor(context, opConfig, jobConfig, event) {
    console.log('top processor getting called');
    return function(data, logger_in) {
        throw new Error('i am a runtime level processor error')

    }
}

function schema() {
    return {
        
    };
}



module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
