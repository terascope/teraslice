'use strict';

const chunkFormatter = require('./lib/formatters');


function _averageRecordSize(array) {
    return Math.floor(array.reduce((accum, str) => accum + str.length, 0) / array.length);
}


// This function will grab the chunk of data specified by the slice plus an extra margin if the
// slice is not at the end of the file. It needs to read the file twice, first grabbing the data
// specified in the slice and then the margin, which gets appended to the data
function getChunk(readerClient, slice, opConfig, logger) {
    function getMargin(marginOpts) {
        // This grabs the start of the margin up to the first delimiter, which should be the
        // remainder of a truncated record
        return readerClient(marginOpts.offset, marginOpts.length)
            .then(data => data.split(opConfig.delimiter)[0]);
    }

    let needMargin = false;
    if (slice.length) {
        // Determines whether or not to grab the extra margin.
        if (slice.offset + slice.length !== slice.total) {
            needMargin = true;
        }
    }

    return readerClient(slice.offset, slice.length)
        .then((data) => {
            const finalChar = data[data.length - 1];
            // Skip the margin if the raw data ends with a newline since it will end with a complete
            // record
            if (finalChar === '\n') {
                needMargin = false;
            }
            if (needMargin) {
                const avgSize = _averageRecordSize(data.split(opConfig.delimiter));
                const marginOptions = {};
                // Safety margin of two average-sized records
                marginOptions.length = avgSize * 2;
                marginOptions.offset = slice.offset + slice.length;
                return getMargin(marginOptions)
                    .then(margin => _cleanData(`${data}${margin}`, slice, opConfig));
            }
            // logger.info(data);
            return _cleanData(data, slice, opConfig);
        })
        .then(data => chunkFormatter[opConfig.format](data, logger));
}

// This function takes the raw data and breaks it into records, getting rid of anything preceding
// the first complete record if the data does not start with a complete record
function _cleanData(rawData, slice, opConfig) {
    /* Since slices with a non-zero chunk offset grab the character immediately preceding the main
     * chunk, if one of those chunks has a delimiter as the first or second character, it means the
     * chunk starts with a complete record. In this case as well as when the chunk begins with a
     * partial record, splitting the chunk into an array by its delimiter will result in a single
     * garbage record at the beginning of the array. If the offset is 0, the array will never start
     * with a garbage record
     */

    let outputData = rawData;
    // Get rid of last character if it is the delimiter since that will just result in an empty
    // record
    if (rawData[rawData.length - 1] === opConfig.delimiter) {
        outputData = rawData.substring(0, rawData.length - 1);
    }

    if (slice.offset === 0) {
        // Return everthing
        return outputData.split(opConfig.delimiter);
    }

    return outputData.split(opConfig.delimiter).splice(1);
}

module.exports = {
    getChunk,
    _averageRecordSize
};
