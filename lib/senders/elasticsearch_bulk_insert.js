'use strict';

function newSender(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    //TODO make this based off dynamic config
    var client = context.elasticsearch.default;

    return function(data) {
        console.log('sender getting called', data.length);
        //bulk throws an error if you send an empty array
        if (data.length === 0) {
            return Promise.resolve(null);
        }
        else {           
            return client.bulk({body: data});
        }
    }
}

module.exports = {
    newSender: newSender
};
