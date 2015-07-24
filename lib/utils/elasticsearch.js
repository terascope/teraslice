'use strict';
var Promise = require('bluebird');



function buildQuery(msg){
    var body = {
        index: 'events-*',
        size: 500,
        body:{
            query: {
                filtered: {
                    filter: {
                        range: {
                            date: {
                                gte: msg.start,
                                lt: msg.end
                            }
                        }
                    }
                }
            }
        }
    };

    return body;
}

function getData (client, msg) {
    var query = buildQuery(msg);
    return client.search(query);
}

function processData (data, query){
    //TODO deal with indexing to multiple places
    var dataArray = data.hits.hits;
    var length = dataArray.length;
    var start = 0;
    var formated = [];
    var index = query.index;
    var type = query.type;


    while(start < length) {
       formated.push({"index":{"_index": index, "_type": type, "_id": dataArray[start]._id }});
        formated.push(dataArray[start]._source);
        start++;
   }

    return formated;
}

function sendData (client, data){
    console.log(data.length);
    return client.bulk({body: data});
}

module.exports = {
    getData: getData,
    processData: processData,
    sendData: sendData
};