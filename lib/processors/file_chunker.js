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
var formattedDate = require('./../utils/processor_utils').formattedDate;
var getFileName = require('./../utils/processor_utils').getFileName;

function newProcessor(context, opConfig, jobConfig) {
    var config = context.sysconfig;
    var opConfig = opConfig;
    var logger = jobConfig.logger;

    return function(data) {
        var buckets = {};
        var currentBucket = [];

        var chunks = [];

        // First we need to group the data into reasonably sized chunks as
        // specified by opConfig.chunk_size
        for (var i = 0; i < data.length; i++) {
            var record = data[i];

            if (opConfig.timeseries) {
                var incomingDate = formattedDate(record, opConfig);
                if (!buckets.hasOwnProperty(incomingDate)) {
                    buckets[incomingDate] = [];
                }

                currentBucket = buckets[incomingDate];
            }

            currentBucket.push(JSON.stringify(record));

            if (currentBucket.length >= opConfig.chunk_size) {
                chunks.push({
                    data: currentBucket.join('\n'),
                    filename: getFileName(incomingDate, opConfig, config)
                });

                currentBucket = [];
                if (opConfig.timeseries) {
                    buckets[incomingDate] = [];
                }
            }
        }

        // Handle any lingering chunks.
        _.forOwn(buckets, function(bucket, key) {
            if (bucket.length > 0) {
                chunks.push({
                    data: bucket,
                    filename: getFileName(key, opConfig, config)
                });
            }
        });

        return chunks;
    }
}

function schema() {
    return {
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
    };
}

module.exports = {
    newProcessor: newProcessor,
    schema: schema
};
