'use strict';

var jsf = require('json-schema-faker');
var moment = require('moment');
var dateFormat = require('./elastic_utils').dateFormat;

jsf.formats('isoBetween', function(gen, schema){
    var start = moment(0);  //01 January, 1970 UTC
    var date = moment();

    if(!schema.start) {
        schema.start = start
    }
    if(!schema.end) {
        schema.end = date
    }

    var someDate = gen.faker.date.between(schema.start, schema.end);

    //ex.   "2016-01-19T13:48:08.426-07:00"
    return moment(someDate).format(dateFormat);
});

jsf.formats('utcBetween', function(gen, schema){
    var start = moment(0);  //01 January, 1970 UTC
    var date = moment();

    if(!schema.start) {
        schema.start = start
    }
    if(!schema.end) {
        schema.end = date
    }

    var someDate = gen.faker.date.between(schema.start, schema.end);

    //ex.   "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates
    return moment(someDate).toISOString();
});

jsf.formats('utcDate', function(gen, schema){
    return new Date().toISOString()
});

jsf.formats('dateNow', function(gen, schema){
    return moment().format(dateFormat);
});

module.exports = {
    type: 'object',
    properties: {
        ip: {
            "type": "string",
            "faker": "internet.ip"
        },
        userAgent: {
            type: 'string',
            'faker': 'internet.userAgent'
        },
        url: {
            type: 'string',
            'faker': 'internet.url'
        },
        uuid: {
            type: 'string',
            faker: 'random.uuid'
        },
        created: {
            type: 'string',
            format: 'dateNow'
        },
        ipv6: {
            type: 'string',
            chance: 'ipv6'
        },
        location: {
            type: 'string',
            chance: 'coordinates'
        },
        bytes: {
            type: 'integer',
            chance: {
                integer: {
                    min: 7850,
                    max: 5642867
                }
            }
        }
    },
    required: [ 'ip', 'userAgent','url','uuid','created','ipv6','location','bytes']

};

