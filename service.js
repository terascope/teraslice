#!/usr/bin/env node

// make sure running locally we set timezone to utc

process.env.TZ = 'utc';

import('./packages/teraslice/service.js');
