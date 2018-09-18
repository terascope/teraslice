'use strict';

const makeAnalyticsStore = require('./analytics');
const makeAssetStore = require('./assets');
const makeExStore = require('./execution');
const makeJobStore = require('./jobs');
const makeLogStore = require('./logs');
const makeStateStore = require('./state');

module.exports = {
    makeAnalyticsStore,
    makeAssetStore,
    makeExStore,
    makeJobStore,
    makeLogStore,
    makeStateStore,
};
