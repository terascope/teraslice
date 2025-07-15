// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
// @ts-expect-error
import('setimmediate');

export * from './utils/index.js';
export * from './interfaces.js';
export * from './elasticsearch-client/index.js';
