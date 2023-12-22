import { v4 as uuid } from 'uuid';
import { TSError, makeISODate, Logger } from '@terascope/utils';
import { Context, ValidatedJobConfig, JobConfig } from '@terascope/job-components';
import { JobRecord } from '@terascope/types';
import { makeLogger } from '../workers/helpers/terafoundation.js';
import { TerasliceElasticsearchStorage, TerasliceStorageConfig } from './backends/elasticsearch_store.js';

export class JobsStorage {
    private backend: TerasliceElasticsearchStorage;
    readonly jobType: string;
    logger: Logger;

    constructor(context: Context) {
        const logger = makeLogger(context, 'job_storage');

        const config = context.sysconfig.teraslice;
        const jobType = 'job';
        const indexName = `${config.name}__jobs`;

        const backendConfig: TerasliceStorageConfig = {
            context,
            indexName,
            recordType: 'job',
            idField: 'job_id',
            fullResponse: false,
            logRecord: false,
            storageName: 'jobs',
            logger
        };

        this.logger = logger;
        this.jobType = jobType;
        this.backend = new TerasliceElasticsearchStorage(backendConfig);
    }

    async initialize() {
        await this.backend.initialize();
        this.logger.info('job storage initialized');
    }

    async get(jobId: string): Promise<JobRecord> {
        const doc = await this.backend.get(jobId);
        return doc as JobRecord;
    }

    async search(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        fields?: string | string[]
    ): Promise<JobRecord[]> {
        const results = await this.backend.search(query, from, size, sort, fields);
        return results as JobRecord[];
    }

    async create(record: ValidatedJobConfig): Promise<JobRecord> {
        const date = makeISODate();
        const doc = Object.assign({}, record, {
            job_id: uuid(),
            _context: this.jobType,
            _created: date,
            _updated: date
        });

        try {
            await this.backend.create(doc);
        } catch (err) {
            throw new TSError(err, {
                reason: 'Failure to create job'
            });
        }

        return doc as JobRecord;
    }

    async update(jobId: string, updateSpec: JobConfig): Promise<JobRecord> {
        // We want to save the whole job as it is posted, update api does partial doc updates
        const results = await this.backend.indexWithId(jobId, Object.assign(
            {},
            updateSpec,
            {
                job_id: jobId,
                _context: this.jobType,
                _updated: makeISODate()
            }
        ));

        return results as JobRecord;
    }

    async remove(jobId: string) {
        return this.backend.remove(jobId);
    }

    async shutdown(forceShutdown?: boolean) {
        this.logger.info('shutting down.');
        return this.backend.shutdown(forceShutdown);
    }

    verifyClient() {
        return this.backend.verifyClient();
    }

    async waitForClient() {
        return this.backend.waitForClient();
    }
}
