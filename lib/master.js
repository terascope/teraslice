'use strict';

module.exports = function(context) {

    if (context.sysconfig.teraslice.slicer) {
        return require('./distributed/master')(context);
    }
    else {
        return require('./single_node/master')(context);
    }
};