'use strict';

const ExectionContext = require('./execution-context');

module.exports = function makeExecutionContext(context, executionContext) {
    if (!executionContext.node_id) {
        /* istanbul ignore next */
        executionContext.node_id = context.sysconfig._nodeName;
    }

    return new ExectionContext(context, executionContext).initialize();
};
