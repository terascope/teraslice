'use strict';

const config = require('../jest.config.base')(__dirname);

config.collectCoverage = false;
delete config.transform;
module.exports = config;
