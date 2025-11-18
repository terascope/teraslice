import { Context, WorkerExecutionContext } from '@terascope/job-components';
import { pMap, Logger } from '@terascope/core-utils';
import { Slice, SliceAnalyticsData } from '@terascope/types';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { timeseriesIndex, TimeseriesFormat } from '../utils/date_utils.js';
import { TerasliceElasticsearchStorage, TerasliceESStorageConfig } from './backends/elasticsearch_store.js';

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
export class AnalyticsStorage {
    readonly workerId: string;
    readonly timeseriesFormat: TimeseriesFormat;
    readonly baseIndex: string;
    private backend: TerasliceElasticsearchStorage;
    logger: Logger;

    constructor(context: Context) {
        const logger = makeLogger(context, 'analytics_storage');
        const config = context.sysconfig.teraslice;
        const _index = `${config.name}__analytics`;
        // making this to pass down to backend for dynamic index searches
        const indexName = `${_index}*`;

        const backendConfig: TerasliceESStorageConfig = {
            context,
            indexName,
            recordType: 'analytics',
            idField: '_id',
            fullResponse: false,
            logRecord: false,
            forceRefresh: false,
            storageName: 'analytics',
            logger
        };
        this.workerId = `${context.sysconfig.teraslice.hostname}__${context.cluster.worker?.id}`;
        this.timeseriesFormat = config.index_rollover_frequency.analytics as TimeseriesFormat;
        this.baseIndex = _index;
        this.logger = logger;
        this.backend = new TerasliceElasticsearchStorage(backendConfig);
    }

    async initialize() {
        await this.backend.initialize();
        this.logger.info('analytics storage initialized');
    }

    async log(job: WorkerExecutionContext, sliceInfo: Slice, stats: SliceAnalyticsData, state = 'completed') {
        const { index, timestamp } = timeseriesIndex(this.timeseriesFormat, this.baseIndex);
        // These records are uniquely identified by ex_id + slice_id
        return pMap(
            job.config.operations,
            (op: Record<string, any>, i: number) => this.backend.bulk(
                {
                    '@timestamp': timestamp,
                    ex_id: job.config.ex_id,
                    job_id: job.config.job_id,
                    worker_id: this.workerId,
                    slice_id: sliceInfo.slice_id,
                    slicer_id: sliceInfo.slicer_id,
                    op: op._op,
                    state,
                    order: i,
                    count: stats.size[i],
                    time: stats.time[i],
                    memory: stats.memory[i],
                },
                'index',
                index
            ));
    }

    async get(recordId: string, index: string) {
        return this.backend.get(recordId, index);
    }

    async search(
        query: string | Record<string, any>,
        from = 0,
        size = 10000,
        sort?: string,
        fields?: string | string[]
    ) {
        return this.backend.search(query, from, size, sort, fields);
    }

    async update(
        recordId: string,
        updateSpec: Record<string, any>,
        index?: string
    ) {
        return this.backend.update(recordId, updateSpec, index);
    }

    async remove(recordId: string, index?: string) {
        return this.backend.remove(recordId, index);
    }

    async shutdown(forceShutdown: boolean) {
        this.logger.info('shutting down.');
        return this.backend.shutdown(forceShutdown);
    }

    async refresh() {
        const { index } = timeseriesIndex(this.timeseriesFormat, this.baseIndex);
        return this.backend.refresh(index);
    }

    verifyClient() {
        return this.backend.verifyClient();
    }

    async waitForClient() {
        return this.backend.waitForClient();
    }
}
