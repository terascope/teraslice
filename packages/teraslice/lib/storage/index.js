import makeAnalyticsStore from './analytics.js';
import makeAssetStore from './assets.js';
import makeExStore from './execution.js';
import makeJobStore from './jobs.js';
import makeStateStore from './state.js';

export default {
    SliceState: makeStateStore.SliceState,
    makeAnalyticsStore,
    makeAssetStore,
    makeExStore,
    makeJobStore,
    makeStateStore,
};
