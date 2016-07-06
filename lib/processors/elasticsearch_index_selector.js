'use strict';

var _ = require('lodash');
var indexName = require('./../utils/processor_utils').indexName;

function newProcessor(context, opConfig, jobConfig) {
    var opConfig = opConfig;
    var logger = jobConfig.logger;

    // index_prefix is require if timeseries
    if (opConfig.timeseries && !opConfig.index_prefix) {
        throw new Error("timeseries requires an index_prefix");
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

        if (!opConfig.type && !fromElastic) {
            throw ('type must be specified in elasticsearch index selector config if data is not from elasticsearch');
        }
        var formatted = [];

        function generateRequest(start) {
            var record;
            if (fromElastic) {
                record = dataArray[start]._source;
            } else {
                record = dataArray[start];
            }

            var indexSpec = {};

            var meta = {
                "_index": indexName(record, opConfig),
                "_type": opConfig.type ? opConfig.type : data.hits.hits[start]._type
            };

            if (opConfig.preserve_id) {
                //TODO don't have checks for this to only run when fromElastic is true
                meta._id = data.hits.hits[start]._id;
            }
            else if (opConfig.id_field) {
                if (fromElastic) {
                    meta._id = dataArray[start]._source[opConfig.id_field];
                }
                else {
                    meta._id = dataArray[start][opConfig.id_field];
                }
            }

            if (opConfig.update || opConfig.upsert) {
                indexSpec['update'] = meta;
            }
            else if (opConfig.delete) {
                indexSpec['delete'] = meta;
            }
            else {
                indexSpec['index'] = meta;
            }

            formatted.push(indexSpec);

            if (opConfig.update || opConfig.upsert) {
                var update = {};

                if (opConfig.upsert) {
                    // The upsert field is what is inserted if the key doesn't already exist
                    update.upsert = record;
                }

                // This will merge this record with the existing record.
                if (opConfig.update_fields.length > 0) {
                    update.doc = {};
                    opConfig.update_fields.forEach(function(field) {
                        update.doc[field] = record[field];
                    });
                }
                else if (opConfig.script_file) {
                    update.script = {
                        file: opConfig.script_file
                    };

                    update.script.params = {};
                    _.forOwn(opConfig.script_params, function(field, key) {
                        update.script.params[key] = record[field];
                    });
                }
                else {
                    update.doc = record;
                }

                formatted.push(update);
            }
            else if (opConfig.delete === false) {
                formatted.push(record);
            }
        }

        for (var i = 0; i < dataArray.length; i++) {
            generateRequest(i)
        }

        return formatted;
    }
}


function schema() {
    return {
        index: {
            doc: 'Index to where the data will be sent to, if you wish the index to be based on a timeseries, ' +
            'use the timeseries option instead',
            default: '',
            format: 'required_String'
        },
        type: {
            doc: 'Set the type of the data for elasticsearch. If incoming data is from elasticsearch' +
            ' it will default to the type on the metadata if this field is not set. This field must be set' +
            'for all other incoming data',
            default: '',
            format: 'optional_String'
        },
        preserve_id: {
            doc: 'If incoming data if from elasticsearch, set this to true if you wish to keep the previous id' +
            ' else elasticsearch will generate one for you (upload performance is faster if you let it auto-generate)',
            default: false,
            format: Boolean
        },
        id_field: {
            doc: 'If you wish to set the id based off another field in the doc, set the name of the field here',
            default: '',
            format: 'optional_String'
        },
        timeseries: {
            doc: 'Set to either daily, monthly or yearly if you want the index to be based off it, must be ' +
            'used in tandem with index_prefix and date_field',
            default: '',
            format: function(value) {
                // This will generate logstash style timeseries names
                if (value && (!_.contains(['daily', 'monthly', 'yearly'], value))) {
                    throw new Error("timeseries must be one of 'daily', 'monthly', 'yearly'");
                }
            }
        },
        index_prefix: {
            doc: 'Used with timeseries, adds a prefix to the date ie (index_prefix: "events-" ,timeseries: "daily => ' +
            'events-2015.08.20',
            default: '',
            format: 'optional_String'
        },
        date_field: {
            doc: 'Used with timeseries, specify what field of the data should be used to calculate the timeseries',
            default: '@timestamp',
            format: 'optional_String'
        },
        delete: {
            doc: 'Use the id_field from the incoming records to bulk delete documents.',
            default: false,
            format: Boolean
        },
        update: {
            doc: 'Specify if the data should update the records or, if not it will index them',
            default: false,
            format: Boolean
        },
        upsert: {
            doc: 'Specify if the incoming records should be used to perform an upsert. If update_fields is also specified then existing records will be updated with those fields otherwise the full incoming record will be inserted.',
            default: false,
            format: Boolean
        },
        update_fields: {
            doc: 'if you are updating the documents, you can specify fields to update here (it should be an array ' +
            'containing all the field names you want updated), it defaults to sending the entire document',
            default: [],
            format: Array
        },
        script_file: {
            doc: 'Name of the script file to run as part of an update request.',
            default: '',
            format: 'optional_String'
        },
        script_params: {
            doc: 'key -> value parameter mappings. The value will be extracted from the incoming data and passed to the script as param based on the key.',
            default: {},
            format: Object
        }
    };
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
