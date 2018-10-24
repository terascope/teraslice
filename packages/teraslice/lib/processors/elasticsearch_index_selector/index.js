'use strict';

const _ = require('lodash');
const util = require('util');

function newProcessor(context, opConfig) {
    function formattedDate(record) {
        const offsets = {
            daily: 10,
            monthly: 7,
            yearly: 4
        };

        const end = offsets[opConfig.timeseries] || 10;
        let date;
        try {
            date = new Date(record[opConfig.date_field]).toISOString().slice(0, end);
        } catch (err) {
            throw new Error(`opConfig date field: ${opConfig.date_field} either does not exists or is not a valid date on the records processed`);
        }

        return date.replace(/-/gi, '.');
    }

    function indexName(record) {
        if (opConfig.timeseries) {
            const index = formattedDate(record);
            const prefix = opConfig.index_prefix;
            const indexPrefix = prefix.charAt(prefix.length - 1) === '-' ? prefix : `${prefix}-`;

            return indexPrefix + index;
        }

        return opConfig.index;
    }

    function getMetadata(record, key) {
        if (typeof record.getMetadata === 'function') {
            return record.getMetadata(key);
        }
        return record[key];
    }

    /*
     * Additional configuration fields. Should validate once a schema is available.
     * update - boolean. set to true if the ES request should be an update
     * update_fields - array or strings. Will pull the specified fields from the data record
     *    and create an upsert request
     * id_field - string. Name of the field that contains the id to use for the inserted record.
     * preserve_id - boolean. if incoming data is from ES the existing ID
     * of the record will be preserved.
     */

    return (data) => {
        let fromElastic = false;
        let dataArray = data;
        const fullResponseData = _.get(dataArray, 'hits.hits');

        if (fullResponseData) {
            fromElastic = true;
            dataArray = fullResponseData;
        }
        const formatted = [];

        function generateRequest(start) {
            let record;
            if (fromElastic) {
                record = dataArray[start]._source;
            } else {
                record = dataArray[start];
            }
            const indexSpec = {};

            const meta = {
                _index: indexName(record),
                _type: opConfig.type
            };

            if (opConfig.preserve_id) meta._id = getMetadata(record, '_key');
            if (fromElastic) meta._id = data.hits.hits[start]._id;
            if (opConfig.id_field) meta._id = record[opConfig.id_field];

            if (opConfig.update || opConfig.upsert) {
                indexSpec.update = meta;

                if (opConfig.update_retry_on_conflict > 0) {
                    meta._retry_on_conflict = opConfig.update_retry_on_conflict;
                }
            } else if (opConfig.delete) {
                indexSpec.delete = meta;
            } else if (opConfig.create) {
                indexSpec.create = meta;
            } else {
                indexSpec.index = meta;
            }

            formatted.push(indexSpec);

            if (opConfig.update || opConfig.upsert) {
                const update = {};

                if (opConfig.upsert) {
                    // The upsert field is what is inserted if the key doesn't already exist
                    update.upsert = record;
                }

                // This will merge this record with the existing record.
                if (opConfig.update_fields.length > 0) {
                    update.doc = {};
                    opConfig.update_fields.forEach((field) => {
                        update.doc[field] = record[field];
                    });
                } else if (opConfig.script_file || opConfig.script) {
                    if (opConfig.script_file) {
                        update.script = {
                            file: opConfig.script_file
                        };
                    }

                    if (opConfig.script) {
                        update.script = {
                            inline: opConfig.script
                        };
                    }

                    update.script.params = {};
                    _.forOwn(opConfig.script_params, (field, key) => {
                        if (record[field]) {
                            update.script.params[key] = record[field];
                        }
                    });
                } else {
                    update.doc = record;
                }

                formatted.push(update);
            } else if (opConfig.delete === false) {
                formatted.push(record);
            }
        }

        for (let i = 0; i < dataArray.length; i += 1) {
            generateRequest(i);
        }

        return formatted;
    };
}


function schema() {
    return {
        index: {
            doc: 'Index to where the data will be sent to, if you wish the index to be based on a timeseries, '
              + 'use the timeseries option instead',
            default: '',
            format(val) {
                if (typeof val !== 'string') {
                    throw new Error('index must be of type string');
                }

                if (val.match(/[A-Z]/)) {
                    throw new Error('index must be lowercase');
                }
            }
        },
        type: {
            doc: 'Set the type of the data for elasticsearch. If incoming data is from elasticsearch'
            + ' it will default to the type on the metadata if this field is not set. This field must be set'
            + 'for all other incoming data',
            default: '',
            format: 'optional_String'
        },
        preserve_id: {
            doc: 'If incoming data if from elasticsearch, set this to true if you wish to keep the previous id'
            + ' else elasticsearch will generate one for you (upload performance is faster if you let it auto-generate)',
            default: false,
            format: Boolean
        },
        id_field: {
            doc: 'If you wish to set the id based off another field in the doc, set the name of the field here',
            default: '',
            format: 'optional_String'
        },
        timeseries: {
            doc: 'Set to either daily, monthly or yearly if you want the index to be based off it, must be '
            + 'used in tandem with index_prefix and date_field',
            default: '',
            format(value) {
                // This will generate logstash style timeseries names
                if (value && (!_.includes(['daily', 'monthly', 'yearly'], value))) {
                    throw new Error("timeseries must be one of 'daily', 'monthly', 'yearly'");
                }
            }
        },
        index_prefix: {
            doc: 'Used with timeseries, adds a prefix to the date ie (index_prefix: "events-" ,timeseries: "daily => '
            + 'events-2015.08.20',
            default: '',
            format(val) {
                if (val) {
                    if (typeof val !== 'string') {
                        throw new Error('index_prefix must be of type string');
                    }
                    if (val.match(/[A-Z]/)) {
                        throw new Error('index_prefix must be lowercase');
                    }
                }
            }
        },
        date_field: {
            doc: 'Used with timeseries, specify what field of the data should be used to calculate the timeseries',
            default: '',
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
            format(val) {
                if (isNaN(val)) {
                    throw new Error('update_retry_on_conflict for elasticsearch_bulk must be a number');
                } else if (val < 0) {
                    throw new Error('update_retry_on_conflict for elasticsearch_bulk must be greater than or equal to zero');
                }
            }
        },
        update_fields: {
            doc: 'if you are updating the documents, you can specify fields to update here (it should be an array '
            + 'containing all the field names you want updated), it defaults to sending the entire document',
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
            default: '',
            format: 'optional_String'
        },
        script: {
            doc: 'Inline script to include in each indexing request. Only very simple painless scripts are currently supported.',
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

function selfValidation(op) {
    if (op.timeseries || op.index_prefix || op.date_field) {
        if (!(op.timeseries && op.index_prefix && op.date_field)) {
            throw new Error('elasticsearch_index_selector is mis-configured, if any of the following configurations are set: timeseries, index_prefix or date_field, they must all be used together, please set the missing parameters');
        }
    }
}

function crossValidation(job) {
    const opConfig = job.operations.find(op => op._op === 'elasticsearch_index_selector');
    const preserveId = job.operations.find(op => op.preserve_id === true);

    if (!opConfig.type && !preserveId) {
        throw new Error('type must be specified in elasticsearch index selector config if data is not a full response from elasticsearch');
    }
}

const depMsg = 'This native processors in teraslice are being deprecated, please use the elasticsearch-assets project with the assets api to use this module';
const code = 'esReader';

module.exports = {
    newProcessor: util.deprecate(newProcessor, depMsg, code),
    schema: util.deprecate(schema, depMsg, code),
    crossValidation: util.deprecate(crossValidation, depMsg, code),
    selfValidation: util.deprecate(selfValidation, depMsg, code)
};
