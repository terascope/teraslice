'use strict';

module.exports = function(context) {

    if (context.sysconfig.teraslice.distributed) {
        return require('./distributed/worker')(context);
    }
    else {
        return require('./single_node/worker')(context);
    }
};