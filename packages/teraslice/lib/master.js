
'use strict';

/* istanbul ignore next */
module.exports = function _master(context) {
    return require('./cluster/node_master')(context);
};
