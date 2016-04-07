'use strict';

module.exports = function(context) {
    if (context.sysconfig.teraslice.cluster) {
        return require('./cluster/node_master')(context)
    }
    return require('./single_node/master')(context)
};