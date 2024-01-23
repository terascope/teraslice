#!/usr/bin/env node

// make sure running locally we set timezone to utc
// eslint-disable-next-line strict
process.env.TZ = 'utc';
// eslint-disable-next-line import/extensions, import/no-relative-packages
import('./packages/teraslice/service.js');
