#!/usr/bin/env node

'use strict';

// make sure running locally we set timezone to utc
process.env.TZ = 'utc';
require('./packages/teraslice/service');
