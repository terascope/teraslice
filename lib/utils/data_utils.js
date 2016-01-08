'use strict';

var jsf = require('json-schema-faker');

jsf.formats('isoBetween', function(gen, schema){
    var start = new Date(0);  //01 January, 1970 UTC
    var date = new Date();

    if(!schema.start) {
        schema.start = start
    }
    if(!schema.end) {
        schema.end = date
    }

    var someDate = gen.faker.date.between(schema.start, schema.end);

    return someDate.toISOString();
});

jsf.formats('isoDate', function(gen, schema){
    return new Date().toISOString()
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
            format: 'isoBetween',
            "start":"2015-12-07T04:00:00",
            "end":"2015-12-07T08:00:00"
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

