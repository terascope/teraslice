'use strict';

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
        date: {
            type: 'string',
            faker: 'date.past'
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
    required: ['user', 'ip', 'userAgent','url','uuid','date','ipv6','location','bytes']

};

