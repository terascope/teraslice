var getClient = require('../utils/config').getClient;

var parallelSlicers = true;

function newSlicer(context, job, retryData) {
    var opConfig = job.readerConfig;

    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./elasticsearch_date_range/slicer.js')(context, job, retryData, client);
}

function newReader(context, opConfig, jobConfig) {
    var client = getClient(context, opConfig, 'elasticsearch');

    return require('./elasticsearch_date_range/reader.js')(context, opConfig, jobConfig, client);
}

function schema() {
    return {
        index: {
            doc: 'Which index to read from',
            default: '',
            format: 'required_String'

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
            default: '',
            format: 'optional_Date'
        },
        end: {
            doc: 'The end date (ISOstring or in ms) to which it will read to',
            default: null,
            format: 'optional_Date'
        },
        interval: {
            doc: 'The time interval in which it will read from, the number must be separated from the unit of time ' +
            'by an underscore. The unit of time may be months, weeks, days, hours, minutes, seconds, millesconds ' +
            'or their appropriate abbreviations',
            default: 'auto',
            format: 'required_String'
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
        delay: {
            doc: 'used for persistent',
            default: '30s',
            format: 'optional_String'
        }
    };
}

module.exports = {
    newReader: newReader,
    newSlicer: newSlicer,
    schema: schema,
    parallelSlicers: parallelSlicers
};