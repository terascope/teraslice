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

module.exports = {
    formattedDate: formattedDate
};