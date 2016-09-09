'use strict';

var moment = require('moment');
var dateFormat = require('./elastic_utils').dateFormat;


module.exports = function(opConfig, otherSchema) {
    var startDate = moment(0);  //01 January, 1970 UTC
    var endDate = moment();
    var nativeSchema = {
        ip: {
            "faker": "internet.ip"
        },
        userAgent: {
            'faker': 'internet.userAgent'
        },
        url: {
            'faker': 'internet.url'
        },
        uuid: {
            faker: 'random.uuid'
        },
        created: {
            function: dateNow
        },
        ipv6: {
            chance: 'ipv6'
        },
        location: {
            chance: 'coordinates'
        },
        bytes: {
            chance: 'integer({"min": 7850, "max": 5642867})'
        }
    };

    var schema = otherSchema ? otherSchema : nativeSchema;

    if (opConfig.start) {
        startDate = moment(opConfig.start);
    }

    if (opConfig.end) {
        endDate = moment(opConfig.end);
    }

    var start = startDate.valueOf();
    var end = endDate.valueOf();
    var diff = end - start;

    function utcDate() {
        return new Date().toISOString()
    }

    function dateNow() {
        return moment().format(dateFormat);
    }

    function isoBetween() {
        //ex.   "2016-01-19T13:48:08.426-07:00"
        return moment(start + Math.random() * diff).format(dateFormat);
    }

    function utcBetween() {
        //ex.   "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates
        return moment(start + Math.random() * diff).toISOString();
    }

    var formatOptions = {
        dateNow: dateNow,
        isoBetween: isoBetween,
        utcDate: utcDate,
        utcBetween: utcBetween
    };

    if (opConfig.format) {
        var fn = formatOptions[opConfig.format];
        schema[opConfig.date_key].function = fn;
    }

    return schema
};

