'use strict';

const { ProcessContext } = require('terafoundation');
const { getTerasliceConfig } = require('../../config');

module.exports = function makeTerafoundationContext({ sysconfig } = {}) {
    return new ProcessContext(getTerasliceConfig(), sysconfig ? {
        configfile: sysconfig
    } : undefined);
};
