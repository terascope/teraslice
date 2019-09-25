'use strict';

const { singleContext } = require('terafoundation');
const { getTerasliceConfig } = require('../../config');

module.exports = function makeTerafoundationContext({ sysconfig } = {}) {
    return singleContext(getTerasliceConfig(), { sysconfig });
};
