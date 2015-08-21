'use strict';

/*
 * file_chunker takes an incoming stream of records and prepares them for
 * writing to a file. This is largely intended for sending data to HDFS
 * but could be used for other tasks.
 *
 * The data is collected into chunks based on 'chunk_size' and is serialized
 * to a string.
 *
 * The result of this operation is an array of objects mapping chunks to file
 * names. There can be multiple chunks for the same filename.
 * [
 *   { filename: '/path/to/file', data: 'the data'}
 * ]
 */

var _ = require('lodash');

var convict = require('convict');

function newProcessor(context, opConfig, jobConfig) {
    var config = context.sysconfig;

    var logger = context.logger;

    function formattedDate(record) {
        var offsets = {
            "daily": 10,
            "monthly": 7,
            "yearly": 4
        }

        var end = offsets[opConfig.timeseries] || 10;

        var date = new Date(record[opConfig.date_field]).toISOString().slice(0, end);

        return date.replace(/-/gi, '.');
    }

    function getFilename(date) {
        var directory = opConfig.directory;
        if (date) {
            directory = opConfig.directory + '-' + date;
        }

        // If filename is specified we default to this
        var filename = directory + '/' + config._nodeName;

        if (opConfig.filename) filename = directory + '/' + opConfig.filename;

        return filename;
    }

    return function(data) {
        var buckets = {};
        var currentBucket = [];

        var chunks = [];

        var directory = opConfig.directory;

        // First we need to group the data into reasonably sized chunks as
        // specified by opConfig.chunk_size
        for (var i = 0; i < data.length; i++) {
            var record = data[i];

            if (opConfig.timeseries) {
                var incomingDate = formattedDate(record);
                if (! buckets.hasOwnProperty(incomingDate)) {
                    buckets[incomingDate] = [];
                }

                currentBucket = buckets[incomingDate];
            }

            currentBucket.push(JSON.stringify(record));

            if (currentBucket.length >= opConfig.chunk_size) {
                chunks.push({
                    data: currentBucket.join('\n'),
                    filename: getFilename(incomingDate)
                });

                currentBucket = [];
                if (opConfig.timeseries) buckets[incomingDate] = [];
            }
        }

        // Handle any lingering chunks.
        _.forOwn(buckets, function(bucket, key) {
            if (bucket.length > 0) {
                chunks.push({
                    data: bucket,
                    filename: getFilename(key)
                });
            }
        });

        return chunks;
    }
}

function schema(){
    return convict({
        op: {
            doc: 'Name of operation, it must reflect the name of the file',
            default: null,
            format: 'required_String'
        },
        timeseries: {
            doc: 'Set to an interval to have directories named using a date field from the data records.',
            default: '',
            format: ['daily', 'monthly', 'yearly']
        },
        date_field: {
            doc: 'Which field in each data record contains the date to use for timeseries. Only useful if "timeseries" is also specified.',
            default: 'date',
            format: String
        },
        directory: {
            doc: 'Path to use when generating the file name. Default: /',
            default: '/',
            format: String
        },
        filename: {
            doc: 'Filename to use. This is optional and is not recommended if the target is HDFS. If not specified a filename will be automatically chosen to reduce the occurence of concurrency issues when writing to HDFS.',
            default: '',
            format: 'optional_String'
        },
        chunk_size: {
            doc: 'Size of the data chunks. Specified in bytes. A new chunk will be created when this size is surpassed. Default: 50000',
            default: 50000,
            format: Number
        }
    })
}


module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
