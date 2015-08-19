'use strict';

var _ = require('lodash');
var convict = require('convict');



function newProcessor(context, opConfig, jobConfig) {
    var context = context;
    var opConfig = opConfig;

    var logger = context.logger;

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

    /*
     * Additional configuration fields. Should validate once a schema is available.
     * update - boolean. set to true if the ES request should be an update
     * upsert_fields - array or strings. Will pull the specified fields from the data record
     *    and create an upsert request
     * id_field - string. Name of the field that contains the id to use for the inserted record.
     * preserve_id - boolean. if incoming data is from ES the existing ID of the record will be preserved.
     */
    return function(data) {

        var fromElastic = false;
        var dataArray;

        if (data.hits && data.hits.hits) {
            fromElastic = true;
            dataArray = data.hits.hits
        } else {
            dataArray = data;
        }

        var formated = [];

        function generateRequest(start) {
            var record;
            if (fromElastic) {
                record = dataArray[start]._source;
            } else {
                record = dataArray[start];
            }

            var indexSpec = {};

            var meta = {
                "_index": indexName(data[start], opConfig),
                "_type": opConfig.type ? opConfig.type : data.hits.hits[start]._type,
            };

            if (opConfig.preserve_id) {
                meta._id = data.hits.hits[start]._id;
            }
            else if (opConfig.id_field) {
                meta._id = dataArray[start][opConfig.id_field];
            }

            if (opConfig.update) {
                indexSpec['update'] = meta;
            }
            else {
                indexSpec['index'] = meta;
            }

            formated.push(indexSpec);

            if (opConfig.update) {
                var update = {
                    doc: record
                }

                if (opConfig.upsert_fields) {
                    update.upsert = {};
                    opConfig.upsert_fields.forEach(function(field) {
                        update.upsert[field] = record[field];
                    })
                }

                formated.push(update);
            }
            else {
                formated.push(record);
            }
        }

        for (var i = 0; i < dataArray.length; i++) {
            generateRequest(i)
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

function schema(){
    return convict({})
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
