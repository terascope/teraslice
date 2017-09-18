'use strict';

const getClient = require('../utils/config').getClient;
const getOpConfig = require('../utils/config').getOpConfig;
const dateOptions = require('../utils/date_utils').dateOptions;
const dateMath = require('datemath-parser');
const moment = require('moment');

const slicer = require('./elasticsearch_date_range/slicer.js');
const reader = require('./elasticsearch_date_range/reader.js');

function _registerContextAPI(context) {
    // This is exposed primarily so that the API reader can override the client
    // implementation without having to directly include teraslice core source
    // code.
    context.apis.registerAPI('elasticsearch_reader', {
        slicer,
        reader
    });
}

function newSlicer(context, job, retryData, slicerAnalytics, logger) {
    const opConfig = getOpConfig(job.jobConfig, 'elasticsearch_reader');
    const client = getClient(context, opConfig, 'elasticsearch');

    _registerContextAPI(context);

    return slicer(context, opConfig, job, retryData, logger, client);
}

function newReader(context, opConfig, jobConfig) {
    const client = getClient(context, opConfig, 'elasticsearch');

    _registerContextAPI(context);

    return reader(context, opConfig, jobConfig, client);
}

function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: '',
            format(val) {
                if (typeof val !== 'string') {
                    throw new Error('index must be of type string');
                }

                if (val.length === 0) {
                    throw new Error('index must not be an empty string');
                }

                if (val.match(/[A-Z]/)) {
                    throw new Error('index must be lowercase');
                }
            }

        },
        type: {
            doc: 'type of the document in the index, used for key searches',
            default: '',
            format: 'optional_String'
        },
        size: {
            doc: 'The limit to the number of docs pulled in a chunk, if the number of docs retrieved ' +
            'by the interval exceeds this number, it will cause the function to recurse to provide a smaller batch',
            default: 5000,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('size parameter for elasticsearch_reader must be a number');
                } else if (val <= 0) {
                    throw new Error('size parameter for elasticsearch_reader must be greater than zero');
                }
            }
        },
        start: {
            doc: 'The start date (ISOstring or in ms) to which it will read from ',
            default: null,
            format(val) {
                if (val) {
                    if (typeof val === 'string' || typeof val === 'number') {
                        if (!moment(new Date(val)).isValid()) {
                            try {
                                dateMath.parse(val);
                            } catch (err) {
                                throw new Error(`value: "${val}" cannot be coerced into a proper date`);
                            }
                        }
                    } else {
                        throw new Error('parameter must be a string or number IF specified');
                    }
                }
            }
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: null,
            format(val) {
                if (val) {
                    if (typeof val === 'string' || typeof val === 'number') {
                        if (!moment(new Date(val)).isValid()) {
                            try {
                                dateMath.parse(val);
                            } catch (err) {
                                throw new Error(`value: "${val}" cannot be coerced into a proper date`);
                            }
                        }
                    } else {
                        throw new Error('parameter must be a string or number IF specified');
                    }
                }
            }
        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: 'auto',
            format(val) {
                if (val === 'auto') return;
                dateOptions(val);
            }
        },
        full_response: {
            doc: 'Set to true to receive the full Elasticsearch query response including index metadata.',
            default: false,
            format: Boolean
        },
        date_field_name: {
            doc: 'field name where the date of the doc is located',
            default: '',
            format: 'required_String'
        },
        query: {
            doc: 'You may place a lucene query here, and the slicer will use it when making slices',
            default: '',
            format: 'optional_String'
        },
        fields: {
            doc: 'used to only return fields that you are interested in',
            default: null,
            format(val) {
                function isString(elem) {
                    return typeof elem === 'string';
                }

                if (val !== null) {
                    if (!Array.isArray(val)) {
                        throw new Error('Fields parameter must be an array');
                    }
                    if (!val.every(isString)) {
                        throw new Error('the values listed in the fields array must be of type string');
                    }
                }
            }
        },
        delay: {
            doc: 'used for persistent',
            default: '30s',
            format: 'optional_String'
        },
        subslice_by_key: {
            doc: 'determine if slice should be further divided up by id if slice is to too big',
            default: false,
            format: Boolean
        },
        subslice_key_threshold: {
            doc: 'After subslicing as far as possible, the docs threshold to initiate division by keys',
            default: 50000,
            format(val) {
                if (isNaN(val)) {
                    throw new Error('subslice_key_threshold parameter for elasticsearch_reader must be a number');
                } else if (val <= 0) {
                    throw new Error('subslice_key_threshold parameter for elasticsearch_reader must be greater than zero');
                }
            }
        },
        time_resolution: {
            doc: 'indicate if data reading has second or millisecond resolutions',
            default: 's',
            format(val) {
                const obj = {
                    seconds: 's',
                    second: 's',
                    s: 's',
                    milliseconds: 'ms',
                    millisecond: 'ms',
                    ms: 'ms'
                };
                if (!obj[val]) {
                    throw new Error('time_resolution for elasticsearch_reader must be set in either "s"[seconds] or "ms"[milliseconds]');
                } else {
                    return obj[val];
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
            throw new Error('If subslice_by_key is set to true, the elasticsearch type parameter of the documents must also be set');
        }
    }
}

module.exports = {
    newReader,
    newSlicer,
    schema,
    op_validation
};
