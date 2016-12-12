'use strict';

var getClient = require('../utils/config').getClient;
var getOpConfig = require('../utils/config').getOpConfig;
var dateOptions = require('../utils/elastic_utils').dateOptions;
var dateMath = require('datemath-parser');
var moment = require('moment');

var parallelSlicers = true;

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    var opConfig = getOpConfig(job.jobConfig, 'elasticsearch_reader');
    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./elasticsearch_date_range/slicer.js')(context, opConfig, job, retryData, logger, client);
}

function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./elasticsearch_date_range/reader.js')(context, opConfig, jobConfig, client);
}

function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: "",
            format: 'required_String'

        },
        type: {
            doc: 'type of the document in the index, used for key searches',
            default: "",
            format: 'optional_String'
        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_reader must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('size parameter for elasticsearch_reader must be greater than zero')
                    }
                }
            }
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: null,
            format: function(val) {
                if (val) {
                    if (typeof val === 'string' || typeof val === 'number') {
                        if (!moment(new Date(val)).isValid()) {
                            try {
                                dateMath.parse(val)
                            }
                            catch (err) {
                                throw new Error(`value: "${val}" cannot be coerced into a proper date`)
                            }
                        }
                    }
                    else {
                        throw new Error('parameter must be a string or number IF specified')
                    }
                }
            }
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: null,
            format: function(val) {
                if (val) {
                    if (typeof val === 'string' || typeof val === 'number') {
                        if (!moment(new Date(val)).isValid()) {
                            try {
                                dateMath.parse(val)
                            }
                            catch (err) {
                                throw new Error(`value: "${val}" cannot be coerced into a proper date`)
                            }
                        }
                    }
                    else {
                        throw new Error('parameter must be a string or number IF specified')
                    }
                }
            }
        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: 'auto',
            format: function(val) {
                dateOptions(val)
            }
        },
        full_response: {
            doc: 'Set to true to receive the full Elasticsearch query response including index metadata.',
            default: false,
            format: Boolean
        },
        date_field_name: {
            doc: 'field name where the date of the doc is located',
            default: "",
            format: 'required_String'
        },
        query: {
            doc: 'You may place a lucene query here, and the slicer will use it when making slices',
            default: "",
            format: 'optional_String'
        },
        delay: {
            doc: 'used for persistent',
            default: '30s',
            format: 'optional_String'
        },
        subslice_by_key: {
            doc: 'determine if slice should be further divided up by id if slice is to too big',
            default: true,
            format: Boolean
        },
        subslice_key_threshold: {
            doc: 'After subslicing as far as possible, the docs threshold to initiate division by keys',
            default: 50000,
            format: function(val) {
                if (isNaN(val)) {
                    throw new Error('subslice_key_threshold parameter for elasticsearch_reader must be a number')
                }
                else {
                    if (val <= 0) {
                        throw new Error('subslice_key_threshold parameter for elasticsearch_reader must be greater than zero')
                    }
                }
            }
        },
        time_resolution: {
            doc: 'indicate if data reading has second or millisecond resolutions',
            default: 's',
            format: function(val) {
                var obj = {
                    seconds: 's', second: 's', s: 's',
                    milliseconds: 'ms', millisecond: 'ms', ms: 'ms'
                };
                if (!obj[val]) {
                    throw new Error('time_resolution for elasticsearch_reader must be set in either "s"[seconds] or "ms"[milliseconds]')
                }
                else {
                    return obj[val]
                }
            }
        },
        key_type: {
            doc: 'The type of id used in index',
            default: 'base64url',
            format: ['base64url', 'hexadecimal']
        }
    };
}

function op_validation(op) {
    if (op.subslice_by_key) {
        if (!op.type) {
            throw new Error('If subslice_by_key is set to true, the elasticsearch type parameter of the documents must also be set')
        }
    }
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    op_validation: op_validation,
    parallelSlicers: parallelSlicers
};