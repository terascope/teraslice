'use strict';

/* eslint-disable no-useless-escape */

const moment = require('moment');
const { dateFormat } = require('./date_utils');

module.exports = function module(opConfig, otherSchema) {
    let startDate = moment(0); // 01 January, 1970 UTC
    let endDate = moment();
    const nativeSchema = {
        ip: {
            faker: 'internet.ip'
        },
        userAgent: {
            faker: 'internet.userAgent'
        },
        url: {
            faker: 'internet.url'
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

    const schema = otherSchema || nativeSchema;

    if (opConfig.start) {
        startDate = moment(opConfig.start);
    }

    if (opConfig.end) {
        endDate = moment(opConfig.end);
    }

    const start = startDate.valueOf();
    const end = endDate.valueOf();
    const diff = end - start;

    function regexID(type) {
        const reg = { randexp: '' };

        if (type === 'base64url') {
            reg.randexp = '[a-zA-Z1-9\-\_]\w{8}';
        }
        if (type === 'hexadecimal') {
            reg.randexp = '[0-9a-f]{8}';
        }
        if (type === 'HEXADECIMAL') {
            reg.randexp = '[0-9A-F]{8}';
        }
        return reg;
    }

    function utcDate() {
        return new Date().toISOString();
    }

    function dateNow() {
        return moment().format(dateFormat);
    }

    function isoBetween() {
        // ex.   "2016-01-19T13:48:08.426-07:00"
        return moment(start + (Math.random() * diff)).format(dateFormat);
    }

    function utcBetween() {
        // ex.   "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates
        return moment(start + (Math.random() * diff)).toISOString();
    }

    const formatOptions = {
        dateNow,
        isoBetween,
        utcDate,
        utcBetween
    };

    if (opConfig.format) {
        const fn = formatOptions[opConfig.format];
        schema[opConfig.date_key].function = fn;
    }

    if (opConfig.set_id) {
        schema.id = regexID(opConfig.set_id);
    }

    if (opConfig.id_start_key) {
        const reg = schema.id.randexp;
        schema.id.randexp = `${opConfig.id_start_key}${reg}`;
    }

    return schema;
};
