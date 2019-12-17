'use strict';

const makeAnalyticsStore = require('./analytics');
const makeAssetStore = require('./assets');
const makeExStore = require('./execution');
const makeJobStore = require('./jobs');
const makeStateStore = require('./state');

module.exports = {
    SliceState: makeStateStore.SliceState,
    makeAnalyticsStore,
    makeAssetStore,
    makeExStore,
    makeJobStore,
    makeStateStore,
};
