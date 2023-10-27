import { v4 as uuid } from 'uuid';
import { TSError, makeISODate, Logger } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import { makeLogger } from '../workers/helpers/terafoundation';
import { TerasliceElasticsearchStorage, TerasliceStorageConfig } from './backends/elasticsearch_store';

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

    async get(jobId: string) {
        return this.backend.get(jobId);
    }

    async search(
        query: string | Record<string, any>,
        from?: number,
        size?: number,
        sort?: string,
        fields?: string | string[]
    ) {
        return this.backend.search(query, from, size, sort, fields);
    }
    // TODO: type this
    async create(record: Record<string, any>) {
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
        return doc;
    }

    async update(jobId: string, updateSpec: Record<string, any>) {
        // We want to save the whole job as it is posted, update api does partial doc updates
        return this.backend.indexWithId(jobId, Object.assign(
            {},
            updateSpec,
            {
                job_id: jobId,
                _context: this.jobType,
                _updated: makeISODate()
            }
        ));
    }

    async remove(jobId: string) {
        return this.backend.remove(jobId);
    }

    async shutdown(forceShutdown: boolean) {
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
