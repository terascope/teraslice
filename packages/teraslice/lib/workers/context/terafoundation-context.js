'use strict';

const { SimpleContext } = require('terafoundation');
const { getTerasliceConfig } = require('../../config');

module.exports = function makeTerafoundationContext({ sysconfig } = {}) {
    return new SimpleContext(getTerasliceConfig(), { sysconfig });
};
