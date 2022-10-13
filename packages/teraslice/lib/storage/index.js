import makeAnalyticsStore from './analytics';
import makeAssetStore from './assets';
import makeExStore from './execution';
import makeJobStore from './jobs';
import makeStateStore from './state';

export default {
    SliceState: makeStateStore.SliceState,
    makeAnalyticsStore,
    makeAssetStore,
    makeExStore,
    makeJobStore,
    makeStateStore,
};
