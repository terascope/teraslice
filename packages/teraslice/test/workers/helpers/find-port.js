'use strict';

const porty = require('porty');
const random = require('lodash/random');

const usedPorts = [];

async function findPort() {
    const min = random(8000, 40000);
    const max = min + 100;

    const port = await porty.find({
        min,
        max,
        avoids: usedPorts,
    });

    usedPorts.push(port);

    return port;
}

module.exports = findPort;
