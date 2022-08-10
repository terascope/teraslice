// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
// @ts-expect-error
import('setimmediate');

export * from './utils';
export * from './cluster';
export * from './index-manager';
export * from './index-model';
export * from './index-store';
export * from './interfaces';
export * from './elasticsearch-client';
