'use strict';
var Promise = require('bluebird');
var getClient = require('../utils/config').getClient;

function newSender(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;
    var limit = opConfig.size;
    //TODO make this based off dynamic config
    //var client = context.elasticsearch.default;
    var client = getClient(context, opConfig, 'elasticsearch');

    return function(data) {
        //bulk throws an error if you send an empty array
        if (data === undefined || data.length === 0) {
            return Promise.resolve(null);
        }
        else {
            if (data.length > limit) {
                return recursiveSend(client, data, limit);
            }
            else {
                return client.bulk({body: data});
            }
        }
    }
}

function recursiveSend(client, dataArray, limit) {
    var fnArray = [];

    while (dataArray.length) {
        var end = dataArray.length > limit ? limit : dataArray.length;
        var data = dataArray.splice(0, end);
        fnArray.push(client.bulk({body: data}))
    }

    return Promise.all(fnArray);
}

function schema() {
    // No schema specified, this just needs elasticsearch_index_selector to be properly configured
    // as well as the correct client from system config
    return {
        size: {
            doc: 'the maximum number of docs it will take at a time, anything past it will be split up and sent' +
            'note that the value should be even, the first doc will be the index data and then the next is the data',
            default: 5000,
            format: function(num){
                if (num % 2 !== 0) {
                    throw new Error('size on elasticsearch_bulk_insert must be an even number')
                }
            }
        }
    };
}

module.exports = {
    newSender: newSender,
    schema: schema,
    recursiveSend: recursiveSend
};
