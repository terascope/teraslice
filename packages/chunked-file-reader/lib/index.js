'use strict';

const chunkFormatter = require('./lib/formatters');


function _averageRecordSize(array) {
    return Math.floor(array.reduce((accum, str) => accum + str.length, 0) / array.length);
}

// [{offset, length}] of chunks `size` assuming `delimiter` for a file with `total` size.
function getOffsets(size, total, delimiter) {
    if (total === 0) {
        return [];
    }
    if (total < size) {
        return [{ length: total, offset: 0 }];
    }
    const fullChunks = Math.floor(total / size);
    const delta = delimiter.length;
    const length = size + delta;
    const chunks = [];
    for (let chunk = 1; chunk < fullChunks; chunk += 1) {
        chunks.push({ length, offset: (chunk * size) - delta });
    }
    // First chunk doesn't need +/- delta.
    chunks.unshift({ offset: 0, length: size });
    // When last chunk is not full chunk size.
    const lastChunk = total % size;
    if (lastChunk > 0) {
        chunks.push({ offset: (fullChunks * size) - delta, length: lastChunk + delta });
    }
    return chunks;
}


// This function will grab the chunk of data specified by the slice plus an
// extra margin if the slice does not end with the delimiter.
function getChunk(readerClient, slice, opConfig, logger, metadata) {
    const { delimiter } = opConfig;

    async function getMargin(offset, length) {
        let margin = '';
        return new Promise(async (resolve) => {
            while (margin.indexOf(delimiter) === -1) {
                // reader clients must return false-y when nothing more to read.
                const chunk = await readerClient(offset, length); // eslint-disable-line no-await-in-loop, max-len
                if (!chunk) {
                    resolve(margin.split(delimiter)[0]);
                    return;
                }
                margin += chunk;
                offset += length; // eslint-disable-line no-param-reassign, max-len
            }
            // Don't read too far - next slice will get it.
            resolve(margin.split(delimiter)[0]);
        });
    }

    // This function takes the raw data and breaks it into records, getting rid
    // of anything preceding the first complete record if the data does not
    // start with a complete record.
    function toRecords(rawData) {
        // Since slices with a non-zero chunk offset grab the character
        // immediately preceding the main chunk, if one of those chunks has a
        // delimiter as the first or second character, it means the chunk starts
        // with a complete record. In this case as well as when the chunk begins
        // with a partial record, splitting the chunk into an array by its
        // delimiter will result in a single garbage record at the beginning of
        // the array. If the offset is 0, the array will never start with a
        // garbage record

        let outputData = rawData;
        if (rawData.endsWith(delimiter)) {
            // Get rid of last character if it is the delimiter since that will
            // just result in an empty record.
            outputData = rawData.slice(0, -delimiter.length);
        }

        if (slice.offset === 0) {
            return outputData.split(delimiter);
        }
        return outputData.split(delimiter).splice(1);
    }

    let needMargin = false;
    if (slice.length) {
        // Determines whether or not to grab the extra margin.
        if (slice.offset + slice.length !== slice.total) {
            needMargin = true;
        }
    }

    return readerClient(slice.offset, slice.length)
        .then(async (data) => {
            if (data.endsWith(delimiter)) {
                // Skip the margin if the raw data ends with the delimiter since
                // it will end with a complete record.
                needMargin = false;
            }
            if (needMargin) {
                // Want to minimize reads since will typically be over the
                // network. Using twice the average record size as a heuristic.
                const avgSize = _averageRecordSize(data.split(delimiter));
                data += await getMargin(slice.offset + slice.length, 2 * avgSize); // eslint-disable-line no-param-reassign, max-len
            }
            return toRecords(data);
        })
        .then(data => chunkFormatter[opConfig.format](data, logger, opConfig, metadata));
}

module.exports = {
    getOffsets,
    getChunk,
    _averageRecordSize
};
