'use strict';

var jsf = require('json-schema-faker');
var moment = require('moment');
var dateFormat = require('./elastic_utils').dateFormat;

jsf.format('isoBetween', function(gen, schema) {
    var start = moment(0);  //01 January, 1970 UTC
    var date = moment();

    if (!schema.start) {
        schema.start = start
    }
    if (!schema.end) {
        schema.end = date
    }

    var someDate = gen.faker.date.between(schema.start, schema.end);

    //ex.   "2016-01-19T13:48:08.426-07:00"
    return moment(someDate).format(dateFormat);
});

jsf.format('utcBetween', function(gen, schema) {
    var start = moment(0);  //01 January, 1970 UTC
    var date = moment();

    if (!schema.start) {
        schema.start = start
    }
    if (!schema.end) {
        schema.end = date
    }

    var someDate = gen.faker.date.between(schema.start, schema.end);

    //ex.   "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates
    return moment(someDate).toISOString();
});

jsf.format('utcDate', function(gen, schema) {
    return new Date().toISOString()
});

jsf.format('dateNow', function(gen, schema) {
    return moment().format(dateFormat);
});

module.exports = {
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
        function: function() {
            return moment().format(dateFormat);
        }
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

