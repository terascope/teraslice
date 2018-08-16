'use strict';

const ExecutionRunner = require('./execution-runner');
const ExectionContext = require('./execution-context');

module.exports = function makeExecutionContext(context, executionContext, useExecutionRunner) {
    if (!executionContext.node_id) {
        /* istanbul ignore next */
        executionContext.node_id = context.sysconfig._nodeName;
    }

    if (useExecutionRunner) {
        return new ExecutionRunner(context, executionContext).initialize();
    }

    return new ExectionContext(context, executionContext).initialize();
};
