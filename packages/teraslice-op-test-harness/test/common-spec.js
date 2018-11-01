'use strict';

const processor = require('./legacy-processors/foo');
const harness = require('../index')();

harness.runProcessorSpecs(processor);
