'use strict';

require('jest-extended');

global.Promise = require('bluebird');

process.env.BLUEBIRD_LONG_STACK_TRACES = '1';

jest.setTimeout(15000);
