// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
// @ts-expect-error
import('setimmediate');

export * from './utils/index.js';
export * from './index-manager.js';
export * from './index-model.js';
export * from './index-store.js';
export * from './interfaces.js';
export * from './elasticsearch-client/index.js';
export * as ElasticsearchTestHelpers from './test-helpers/index.js';
