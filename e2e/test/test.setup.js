'use strict';

require('jest-extended');

// We need long timeouts for some of these jobs
jest.setTimeout(3 * 60 * 1000);

process.env.BLUEBIRD_LONG_STACK_TRACES = '1';
