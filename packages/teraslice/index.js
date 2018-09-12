'use strict';

/**
 * Export of internal components and functions of teraslice.
 *
 * WARNING:
 *      Since these are internal components, breaking changes may occur if using them.
 *      For best results teraslice with an exact semver match, i.e "0.38.0".
*/

const config = require('./lib/config');
const stores = require('./lib/cluster/storage');

module.exports = {
    config,
    stores,
};
