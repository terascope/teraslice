'use strict';

function formattedDate(record, opConfig) {
    var offsets = {
        "daily": 10,
        "monthly": 7,
        "yearly": 4
    };

    var end = offsets[opConfig.timeseries] || 10;
    var date = new Date(record[opConfig.date_field]).toISOString().slice(0, end);

    return date.replace(/-/gi, '.');
}

function indexName(record, opConfig) {
    if (opConfig.timeseries) {

        var index = formattedDate(record, opConfig);
        var prefix = opConfig.index_prefix;
        var index_prefix = prefix.charAt(prefix.length - 1) === '-' ? prefix : prefix + '-';

        return index_prefix + index;
    }
    else {
        return opConfig.index
    }
}

function getFileName(date, opConfig, config) {
    var directory = opConfig.directory;
    if (date) {
        directory = opConfig.directory + '-' + date;
    }

    // If filename is specified we default to this
    var filename = directory + '/' + config._nodeName;

    if (opConfig.filename) {
        filename = directory + '/' + opConfig.filename;
    }

    return filename;
}

module.exports = {
    formattedDate: formattedDate,
    indexName: indexName,
    getFileName: getFileName
};