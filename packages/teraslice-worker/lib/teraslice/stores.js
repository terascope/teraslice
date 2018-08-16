'use strict';

const _ = require('lodash');
const {
    makeAssetStore,
    makeStateStore,
    makeAnalyticsStore,
    makeExStore,
    makeJobStore,
} = require('teraslice');

module.exports = {
    makeAssetStore: _.memoize(makeAssetStore, () => 'always'),
    makeExStore: _.memoize(makeExStore, () => 'always'),
    makeAnalyticsStore: _.memoize(makeAnalyticsStore, () => 'always'),
    makeJobStore: _.memoize(makeJobStore, () => 'always'),
    makeStateStore: _.memoize(makeStateStore, () => 'always'),
};
