import { ElasticsearchDistribution } from '@terascope/types';
import { ExpandWildcards, Health, Bytes } from './interfaces';
import type { Semver } from '../interfaces';

export interface CatIndicesParams {
    index?: string | string[];
    bytes?: Bytes;
    expand_wildcards?: ExpandWildcards;
    health?: Health;
    include_unloaded_segments?: boolean;
    pri?: boolean;
    format?: string
    h?: string | string[];
    help?: boolean
    local?: boolean
    master_timeout?: string | number;
    s?: string[],
    v?: boolean
}

export interface CatIndicesIndicesRecord {
    health?: string;
    h?: string;
    status?: string;
    s?: string;
    index?: string;
    i?: string;
    idx?: string;
    uuid?: string;
    id?: string;
    pri?: string;
    p?: string;
    'shards.primary'?: string;
    shardsPrimary?: string;
    rep?: string;
    r?: string;
    'shards.replica'?: string;
    shardsReplica?: string;
    'docs.count'?: string;
    dc?: string;
    docsCount?: string;
    'docs.deleted'?: string;
    dd?: string;
    docsDeleted?: string;
    'creation.date'?: string;
    cd?: string;
    'creation.date.string'?: string;
    cds?: string;
    'store.size'?: string;
    ss?: string;
    storeSize?: string;
    'pri.store.size'?: string;
    'completion.size'?: string;
    cs?: string;
    completionSize?: string;
    'pri.completion.size'?: string;
    'fielddata.memory_size'?: string;
    fm?: string;
    fielddataMemory?: string;
    'pri.fielddata.memory_size'?: string;
    'fielddata.evictions'?: string;
    fe?: string;
    fielddataEvictions?: string;
    'pri.fielddata.evictions'?: string;
    'query_cache.memory_size'?: string;
    qcm?: string;
    queryCacheMemory?: string;
    'pri.query_cache.memory_size'?: string;
    'query_cache.evictions'?: string;
    qce?: string;
    queryCacheEvictions?: string;
    'pri.query_cache.evictions'?: string;
    'request_cache.memory_size'?: string;
    rcm?: string;
    requestCacheMemory?: string;
    'pri.request_cache.memory_size'?: string;
    'request_cache.evictions'?: string;
    rce?: string;
    requestCacheEvictions?: string;
    'pri.request_cache.evictions'?: string;
    'request_cache.hit_count'?: string;
    rchc?: string;
    requestCacheHitCount?: string;
    'pri.request_cache.hit_count'?: string;
    'request_cache.miss_count'?: string;
    rcmc?: string;
    requestCacheMissCount?: string;
    'pri.request_cache.miss_count'?: string;
    'flush.total'?: string;
    ft?: string;
    flushTotal?: string;
    'pri.flush.total'?: string;
    'flush.total_time'?: string;
    ftt?: string;
    flushTotalTime?: string;
    'pri.flush.total_time'?: string;
    'get.current'?: string;
    gc?: string;
    getCurrent?: string;
    'pri.get.current'?: string;
    'get.time'?: string;
    gti?: string;
    getTime?: string;
    'pri.get.time'?: string;
    'get.total'?: string;
    gto?: string;
    getTotal?: string;
    'pri.get.total'?: string;
    'get.exists_time'?: string;
    geti?: string;
    getExistsTime?: string;
    'pri.get.exists_time'?: string;
    'get.exists_total'?: string;
    geto?: string;
    getExistsTotal?: string;
    'pri.get.exists_total'?: string;
    'get.missing_time'?: string;
    gmti?: string;
    getMissingTime?: string;
    'pri.get.missing_time'?: string;
    'get.missing_total'?: string;
    gmto?: string;
    getMissingTotal?: string;
    'pri.get.missing_total'?: string;
    'indexing.delete_current'?: string;
    idc?: string;
    indexingDeleteCurrent?: string;
    'pri.indexing.delete_current'?: string;
    'indexing.delete_time'?: string;
    idti?: string;
    indexingDeleteTime?: string;
    'pri.indexing.delete_time'?: string;
    'indexing.delete_total'?: string;
    idto?: string;
    indexingDeleteTotal?: string;
    'pri.indexing.delete_total'?: string;
    'indexing.index_current'?: string;
    iic?: string;
    indexingIndexCurrent?: string;
    'pri.indexing.index_current'?: string;
    'indexing.index_time'?: string;
    iiti?: string;
    indexingIndexTime?: string;
    'pri.indexing.index_time'?: string;
    'indexing.index_total'?: string;
    iito?: string;
    indexingIndexTotal?: string;
    'pri.indexing.index_total'?: string;
    'indexing.index_failed'?: string;
    iif?: string;
    indexingIndexFailed?: string;
    'pri.indexing.index_failed'?: string;
    'merges.current'?: string;
    mc?: string;
    mergesCurrent?: string;
    'pri.merges.current'?: string;
    'merges.current_docs'?: string;
    mcd?: string;
    mergesCurrentDocs?: string;
    'pri.merges.current_docs'?: string;
    'merges.current_size'?: string;
    mcs?: string;
    mergesCurrentSize?: string;
    'pri.merges.current_size'?: string;
    'merges.total'?: string;
    mt?: string;
    mergesTotal?: string;
    'pri.merges.total'?: string;
    'merges.total_docs'?: string;
    mtd?: string;
    mergesTotalDocs?: string;
    'pri.merges.total_docs'?: string;
    'merges.total_size'?: string;
    mts?: string;
    mergesTotalSize?: string;
    'pri.merges.total_size'?: string;
    'merges.total_time'?: string;
    mtt?: string;
    mergesTotalTime?: string;
    'pri.merges.total_time'?: string;
    'refresh.total'?: string;
    rto?: string;
    refreshTotal?: string;
    'pri.refresh.total'?: string;
    'refresh.time'?: string;
    rti?: string;
    refreshTime?: string;
    'pri.refresh.time'?: string;
    'refresh.external_total'?: string;
    reto?: string;
    'pri.refresh.external_total'?: string;
    'refresh.external_time'?: string;
    reti?: string;
    'pri.refresh.external_time'?: string;
    'refresh.listeners'?: string;
    rli?: string;
    refreshListeners?: string;
    'pri.refresh.listeners'?: string;
    'search.fetch_current'?: string;
    sfc?: string;
    searchFetchCurrent?: string;
    'pri.search.fetch_current'?: string;
    'search.fetch_time'?: string;
    sfti?: string;
    searchFetchTime?: string;
    'pri.search.fetch_time'?: string;
    'search.fetch_total'?: string;
    sfto?: string;
    searchFetchTotal?: string;
    'pri.search.fetch_total'?: string;
    'search.open_contexts'?: string;
    so?: string;
    searchOpenContexts?: string;
    'pri.search.open_contexts'?: string;
    'search.query_current'?: string;
    sqc?: string;
    searchQueryCurrent?: string;
    'pri.search.query_current'?: string;
    'search.query_time'?: string;
    sqti?: string;
    searchQueryTime?: string;
    'pri.search.query_time'?: string;
    'search.query_total'?: string;
    sqto?: string;
    searchQueryTotal?: string;
    'pri.search.query_total'?: string;
    'search.scroll_current'?: string;
    scc?: string;
    searchScrollCurrent?: string;
    'pri.search.scroll_current'?: string;
    'search.scroll_time'?: string;
    scti?: string;
    searchScrollTime?: string;
    'pri.search.scroll_time'?: string;
    'search.scroll_total'?: string;
    scto?: string;
    searchScrollTotal?: string;
    'pri.search.scroll_total'?: string;
    'segments.count'?: string;
    sc?: string;
    segmentsCount?: string;
    'pri.segments.count'?: string;
    'segments.memory'?: string;
    sm?: string;
    segmentsMemory?: string;
    'pri.segments.memory'?: string;
    'segments.index_writer_memory'?: string;
    siwm?: string;
    segmentsIndexWriterMemory?: string;
    'pri.segments.index_writer_memory'?: string;
    'segments.version_map_memory'?: string;
    svmm?: string;
    segmentsVersionMapMemory?: string;
    'pri.segments.version_map_memory'?: string;
    'segments.fixed_bitset_memory'?: string;
    sfbm?: string;
    fixedBitsetMemory?: string;
    'pri.segments.fixed_bitset_memory'?: string;
    'warmer.current'?: string;
    wc?: string;
    warmerCurrent?: string;
    'pri.warmer.current'?: string;
    'warmer.total'?: string;
    wto?: string;
    warmerTotal?: string;
    'pri.warmer.total'?: string;
    'warmer.total_time'?: string;
    wtt?: string;
    warmerTotalTime?: string;
    'pri.warmer.total_time'?: string;
    'suggest.current'?: string;
    suc?: string;
    suggestCurrent?: string;
    'pri.suggest.current'?: string;
    'suggest.time'?: string;
    suti?: string;
    suggestTime?: string;
    'pri.suggest.time'?: string;
    'suggest.total'?: string;
    suto?: string;
    suggestTotal?: string;
    'pri.suggest.total'?: string;
    'memory.total'?: string;
    tm?: string;
    memoryTotal?: string;
    'pri.memory.total'?: string;
    'search.throttled'?: string;
    sth?: string;
    'bulk.total_operations'?: string;
    bto?: string;
    bulkTotalOperation?: string;
    'pri.bulk.total_operations'?: string;
    'bulk.total_time'?: string;
    btti?: string;
    bulkTotalTime?: string;
    'pri.bulk.total_time'?: string;
    'bulk.total_size_in_bytes'?: string;
    btsi?: string;
    bulkTotalSizeInBytes?: string;
    'pri.bulk.total_size_in_bytes'?: string;
    'bulk.avg_time'?: string;
    bati?: string;
    bulkAvgTime?: string;
    'pri.bulk.avg_time'?: string;
    'bulk.avg_size_in_bytes'?: string;
    basi?: string;
    bulkAvgSizeInBytes?: string;
    'pri.bulk.avg_size_in_bytes'?: string;
}

export type CatIndicesResponse = CatIndicesIndicesRecord[];

export function convertCatIndicesParams(
    params: CatIndicesParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error, master_timeout is deprecated
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
