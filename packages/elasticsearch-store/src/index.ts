// polyfill because opensearch has references to an api that won't exist
// on the client side, should be able to remove in the future
// @ts-expect-error
import('setimmediate');

import * as client from '@terascope/opensearch-client';

/** @deprecated migrated to '@terascope/opensearch-client' */
const Client = client.Client;

/** @deprecated migrated to '@terascope/opensearch-client' */
const ElasticsearchTestHelpers = client.ElasticsearchTestHelpers;

/** @deprecated migrated to '@terascope/opensearch-client' */
const createClient = client.createClient;

/** @deprecated migrated to '@terascope/opensearch-client' */
const fixMappingRequest = client.fixMappingRequest;

/** @deprecated migrated to '@terascope/opensearch-client' */
const getBaseClient = client.getBaseClient;

/** @deprecated migrated to '@terascope/opensearch-client' */
const getClientMetadata = client.getClientMetadata;

/** @deprecated migrated to '@terascope/opensearch-client' getClientVersion */
const getESVersion = client.getClientVersion;

/** @deprecated migrated to '@terascope/opensearch-client' */
const getFlattenedNamesAndTypes = client.getFlattenedNamesAndTypes;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isElasticsearch6 = client.isElasticsearch6;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isElasticsearch8 = client.isElasticsearch8;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isOpensearch = client.isOpensearch;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isOpensearch1 = client.isOpensearch1;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isOpensearch2 = client.isOpensearch2;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isOpensearch3 = client.isOpensearch3;

/** @deprecated migrated to '@terascope/opensearch-client' */
const isValidClient = client.isOpensearch;

export {
    Client, ElasticsearchTestHelpers, createClient, fixMappingRequest,
    getBaseClient, getClientMetadata, getESVersion, getFlattenedNamesAndTypes,
    isElasticsearch6, isElasticsearch8, isOpensearch, isOpensearch1,
    isOpensearch2, isOpensearch3, isValidClient
};

export * from './utils/index.js';
export * from './index-manager.js';
export * from './index-model.js';
export * from './index-store.js';
export * from './interfaces.js';
