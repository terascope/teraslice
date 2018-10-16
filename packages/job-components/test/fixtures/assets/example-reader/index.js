'use strict';

const { legacyReaderShim } = require('../../../..');
const Fetcher = require('./fetcher');
const Slicer = require('./slicer');
const Schema = require('./schema');
const ExampleAPI = require('./api');

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today
module.exports = legacyReaderShim(Slicer, Fetcher, Schema, {
    'example-reader': ExampleAPI
});
