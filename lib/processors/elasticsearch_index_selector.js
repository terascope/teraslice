'use strict';

var _ = require('lodash');


function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    // This will generate logstash style timeseries names
    if (opConfig.timeseries && (!_.contains(['daily', 'monthly', 'yearly'], opConfig.timeseries))) {
        throw "timeseries must be one of 'daily', 'monthly', 'yearly'";
    }

    // indexPrefix is require if timeseries
    if (opConfig.timeseries && !opConfig.indexPrefix) {
        throw "timeseries requires an indexPrefix"
    }

    // dateField is required if timeseries is specified. If not present we'll use a default.
    if (opConfig.timeseries && !opConfig.dateField) {
        opConfig.dateField = '@timestamp';
    }

    return function(data) {

        var fromElastic = false;
        var dataArray;

        if (data.hits && data.hits.hits) {
            fromElastic = true;
            dataArray = data.hits.hits
        } else {
            dataArray = data;
        }

        var length = dataArray.length;
        var start = 0;
        var formated = [];
        var type = opConfig.type;
        var id_field = opConfig.id_field;
        var preserve_id = opConfig.preserve_id;

        if (preserve_id) {

            while (start < length) {
                formated.push({
                    "index": {
                        "_index": indexName(data[start], opConfig),
                        "_type": type ? type : data[start]._type,
                        "_id": dataArray[start]._id
                    }
                });

                if (fromElastic) {
                    formated.push(dataArray[start]._source);
                } else {
                    formated.push(dataArray[start]);
                }

                start++;
            }
        }
        else if (id_field) {
            //setting id from the doc field
            while (start < length) {
                formated.push({
                    "index": {
                        "_index": indexName(data[start], opConfig),
                        "_type": type ? type : data[start]._type,
                        "_id": dataArray[start].id_field
                    }
                });

                if (fromElastic) {
                    formated.push(dataArray[start]._source);
                } else {
                    formated.push(dataArray[start]);
                }

                start++;
            }
        }
        //allowing ES to make the id itself
        else {
            while (start < length) {
                formated.push({
                    "index": {
                        "_index": indexName(data[start], opConfig),
                        "_type": type ? type : data[start]._type
                    }
                });

                if (fromElastic) {
                    formated.push(dataArray[start]._source);
                } else {
                    formated.push(dataArray[start]);
                }
                start++;
            }
        }

        return formated;
    }
}

function indexName(record, opConfig) {
    if (opConfig.timeseries) {
        var end = 10;
        if (opConfig.timeseries === 'monthly') {
            end = 7;
        }
        if (opConfig.timeseries === 'yearly') {
            end = 4;
        }

        var date = new Date(record[opConfig.dateField]).toISOString().slice(0, end);

        return opConfig.indexPrefix + '-' + date.replace(/-/gi, '.');
    }
    else {
        return opConfig.index
    }
}

module.exports = {
    newProcessor: newProcessor
};
