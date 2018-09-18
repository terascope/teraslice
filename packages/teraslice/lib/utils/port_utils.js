'use strict';

const _ = require('lodash');
const porty = require('porty');

async function findPort(ports = {}) {
    const {
        start = 8002,
        end = 40000,
        assetsPort = 8003
    } = ports;

    const range = 100;
    const min = _.random(start, end - range);
    const max = _.min([end, (min + range)]);

    const port = await porty.find({
        min,
        max,
        avoids: [assetsPort],
    });

    return port;
}

function getPorts(context) {
    const portConfig = _.get(context, 'sysconfig.teraslice.slicer_port_range');
    const dataArray = _.split(portConfig, ':');
    const assetsPort = _.toInteger(dataArray[0]);
    const start = assetsPort + 1;
    // range end is non-inclusive, so we need to add one
    const end = _.toInteger(dataArray[1]) + 1;
    return { assetsPort, start, end };
}

module.exports = { findPort, getPorts };
