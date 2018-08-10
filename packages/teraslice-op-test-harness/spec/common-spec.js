'use strict';

const processor = require('./processors/foo');
const harness = require('../index')();

harness.runProcessorSpecs(processor);
