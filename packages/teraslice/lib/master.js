
'use strict';

module.exports = function _master(context) {
    return require('./cluster/node_master')(context);
};
