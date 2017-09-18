'use strict';

const fakeLogger = {
    fatal: function fatal() {},
    error: function error() {},
    warn: function warn() {},
    info: function info() {},
    debug: function debug() {},
    trace: function trace() {},
};

module.exports = fakeLogger;
