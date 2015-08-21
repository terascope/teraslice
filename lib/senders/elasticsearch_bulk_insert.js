'use strict';
var convict = require('convict');


function newSender(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    //TODO make this based off dynamic config
    var client = context.elasticsearch.default;

    return function(data) {
        //bulk throws an error if you send an empty array
        if ( data === undefined || data.length === 0) {
            return Promise.resolve(null);
        }
        else {           
            return client.bulk({body: data});
        }
    }
}

function schema(){
    // No schema specified, this just needs elasticsearch_index_selector to be properly configured
    // as well as the correct client from system config
    return {
        op: {
            doc: 'Name of operation, it must reflect the name of the file',
            default: '',
            format: 'required_String'
        }
    };
}

module.exports = {
    newSender: newSender,
    schema: schema
};
