'use strict';

var _ = require('lodash');
var getOpConfig = require('../utils/config').getOpConfig;


function newProcessor(context, opConfig, jobConfig) {

    function formattedDate(record) {
        var offsets = {
            "daily": 10,
            "monthly": 7,
            "yearly": 4
        };

        var end = offsets[opConfig.timeseries] || 10;
        var date = new Date(record[opConfig.date_field]).toISOString().slice(0, end);

        return date.replace(/-/gi, '.');
    }

    function indexName(record) {
        if (opConfig.timeseries) {

            var index = formattedDate(record);
            var prefix = opConfig.index_prefix;
            var index_prefix = prefix.charAt(prefix.length - 1) === '-' ? prefix : prefix + '-';

            return index_prefix + index;
        }
        else {
            return opConfig.index
        }
    }

    // index_prefix is require if timeseries
    if (opConfig.timeseries && !opConfig.index_prefix) {
        throw new Error("timeseries requires an index_prefix");
    }

    /*
     * Additional configuration fields. Should validate once a schema is available.
     * update - boolean. set to true if the ES request should be an update
     * update_fields - array or strings. Will pull the specified fields from the data record
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
            throw ('type must be specified in elasticsearch index selector config if data is not a full response from elasticsearch');
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
                "_index": indexName(record),
                "_type": opConfig.type ? opConfig.type : data.hits.hits[start]._type
            };

            if (opConfig.preserve_id) {
                if (fromElastic) {
                    meta._id = data.hits.hits[start]._id;
                } else {
                    meta._id = record._id;
                    delete record._id;
                }
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

                if (opConfig.update_retry_on_conflict > 0) {
                    meta._retry_on_conflict = opConfig.update_retry_on_conflict;
                }
            }
            else if (opConfig.delete) {
                indexSpec['delete'] = meta;
            }
            else {
                if (opConfig.create) {
                    indexSpec['create'] = meta;
                }
                else {
                    indexSpec['index'] = meta;
                }
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
            default: "",
            format: function(val) {
                if (typeof val !== 'string') {
                    throw new Error('index must be of type string')
                }

                if (val.length === 0) {
                    throw new Error('index must not be an empty string')
                }

                if (val.match(/[A-Z]/)) {
                    throw new Error('index must be lowercase')
                }
            }
        },
        type: {
            doc: 'Set the type of the data for elasticsearch. If incoming data is from elasticsearch' +
            ' it will default to the type on the metadata if this field is not set. This field must be set' +
            'for all other incoming data',
            default: "",
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
            default: "",
            format: 'optional_String'
        },
        timeseries: {
            doc: 'Set to either daily, monthly or yearly if you want the index to be based off it, must be ' +
            'used in tandem with index_prefix and date_field',
            default: "",
            format: function(value) {
                // This will generate logstash style timeseries names
                if (value && (!_.includes(['daily', 'monthly', 'yearly'], value))) {
                    throw new Error("timeseries must be one of 'daily', 'monthly', 'yearly'");
                }
            }
        },
        index_prefix: {
            doc: 'Used with timeseries, adds a prefix to the date ie (index_prefix: "events-" ,timeseries: "daily => ' +
            'events-2015.08.20',
            default: "",
            format: function(val) {
                if (val) {
                    if (typeof val !== 'string') {
                        throw new Error('index_prefix must be of type string')
                    }
                    if (val.match(/[A-Z]/)) {
                        throw new Error('index_prefix must be lowercase')
                    }
                }
            }
        },
        date_field: {
            doc: 'Used with timeseries, specify what field of the data should be used to calculate the timeseries',
            default: "",
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
        update_retry_on_conflict: {
            doc: 'If there is a version conflict from an update how often should it be retried.',
            default: 0,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('update_retry_on_conflict for elasticsearch_bulk must be a number')
                }
                else {
                    if (val < 0) {
                        throw new Error('update_retry_on_conflict for elasticsearch_bulk must be greater than or equal to zero')
                    }
                }
            }
        },
        update_fields: {
            doc: 'if you are updating the documents, you can specify fields to update here (it should be an array ' +
            'containing all the field names you want updated), it defaults to sending the entire document',
            default: [],
            format: Array
        },
        upsert: {
            doc: 'Specify if the incoming records should be used to perform an upsert. If update_fields is also specified then existing records will be updated with those fields otherwise the full incoming record will be inserted.',
            default: false,
            format: Boolean
        },
        create: {
            doc: 'Specify if the incoming records should be used to perform an create event ("put-if-absent" behavior).',
            default: false,
            format: Boolean
        },
        script_file: {
            doc: 'Name of the script file to run as part of an update request.',
            default: "",
            format: 'optional_String'
        },
        script_params: {
            doc: 'key -> value parameter mappings. The value will be extracted from the incoming data and passed to the script as param based on the key.',
            default: {},
            format: Object
        }
    };
}

function op_validation(op) {
    if (op.timeseries || op.index_prefix || op.date_field) {
        if (!op.timeseries || !op.index_prefix || !op.date_field) {
            throw new Error('elasticsearch_index_selector is mis-configured, if any of the following configurations are set: timeseries, index_prefix or date_field, they must all be used together, please set the missing parameters')
        }
    }
}

function post_validation(job, sysconfig) {
    // var opConfig = getOpConfig(job, 'elasticsearch_index_selector');
    //
    // if (opConfig.preserve_id) {
    //     var full_response = false;
    //     var index = job.operations.findIndex(function(op) {
    //         return op._op === 'elasticsearch_index_selector';
    //     });
    //
    //     for (var i = 0; i < index; i++) {
    //         var op = job.operations[i];
    //         if (op.hasOwnProperty('full_response') && op.full_response) {
    //             full_response = true;
    //         }
    //     }
    //
    //     if (!full_response) {
    //         throw new Error('elasticsearch_index_selector was set to preserve_id but full_response on readers was not set to true')
    //     }
    // }
}

module.exports = {
    newProcessor: newProcessor,
    op_validation: op_validation,
    post_validation: post_validation,
    schema: schema
};
