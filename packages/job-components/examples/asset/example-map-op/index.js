'use strict';

const { legacyProcessorShim } = require('@terascope/job-components');
const Processor = require('./processor');
const Schema = require('./schema');

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
module.exports = legacyProcessorShim(Processor, Schema);
