'use strict';

const _ = require('lodash');

function logOpStats(logger, slice, analyticsData) {
    const str = 'analytics for slice: ';
    let dataStr = '';

    if (_.isString(slice)) {
        dataStr = `${slice}, `;
    } else {
        _.forOwn(slice, (value, key) => {
            if (_.isString(value)) {
                dataStr += `${key} : ${value} `;
            } else {
                dataStr += `${key} : ${JSON.stringify(value)} `;
            }
        });
    }

    _.forOwn(analyticsData, (value, key) => {
        dataStr += `${key} : ${value} `;
    });

    logger.info(str + dataStr);
}

module.exports = { logOpStats };
