'use strict';

module.exports = function(context) {
    return require('./cluster/node_master')(context)
};