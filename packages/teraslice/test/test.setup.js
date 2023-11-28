'use strict';

process.env.USE_DEBUG_LOGGER = 'true';
process.env.NODE_ENV = 'test';

// use a larger timeout
jest.setTimeout(60 * 1000);
